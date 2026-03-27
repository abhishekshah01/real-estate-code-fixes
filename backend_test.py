#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class RealEstateAPITester:
    def __init__(self, base_url="https://code-exec-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.admin_token = None
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"   ✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   📊 Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   📊 Response keys: {list(response_data.keys())}")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   💥 Error response: {error_data}")
                except:
                    print(f"   💥 Error text: {response.text}")
                return False, {}
                
        except Exception as e:
            print(f"   💥 EXCEPTION: {str(e)}")
            return False, {}
    
    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test(
            "API Root",
            "GET", 
            "/api/",
            200
        )
    
    def test_seed_data(self):
        """Seed test data"""
        return self.run_test(
            "Seed Data",
            "POST",
            "/api/seed",
            200
        )
    
    def test_get_properties(self):
        """Test fetching all properties"""
        return self.run_test(
            "Get All Properties",
            "GET",
            "/api/properties",
            200
        )
    
    def test_get_featured_properties(self):
        """Test fetching featured properties"""
        return self.run_test(
            "Get Featured Properties",
            "GET",
            "/api/properties?featured=true&limit=6",
            200
        )
    
    def test_get_properties_with_filters(self):
        """Test property filters"""
        filter_tests = [
            ("Property Type Filter", "/api/properties?property_type=villa"),
            ("Price Range Filter", "/api/properties?min_price=1000000&max_price=3000000"),
            ("Bedrooms Filter", "/api/properties?bedrooms=3"),
            ("City Filter", "/api/properties?city=Malibu"),
            ("Combined Filters", "/api/properties?property_type=apartment&bedrooms=3&city=New%20York")
        ]
        
        results = []
        for test_name, endpoint in filter_tests:
            success, data = self.run_test(test_name, "GET", endpoint, 200)
            results.append(success)
        
        return all(results)
    
    def test_get_single_property(self, property_id=None):
        """Test fetching a single property"""
        if not property_id:
            # First get properties to find an ID
            success, data = self.test_get_properties()
            if success and data and len(data) > 0:
                property_id = data[0]['property_id']
            else:
                print("   ⚠️  No properties available for single property test")
                return False, {}
        
        return self.run_test(
            f"Get Single Property ({property_id})",
            "GET",
            f"/api/properties/{property_id}",
            200
        )
    
    def test_create_inquiry(self):
        """Test creating inquiries"""
        test_inquiries = [
            {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+1234567890",
                "message": "I'm interested in your property listings",
                "inquiry_type": "general"
            },
            {
                "name": "Jane Smith", 
                "email": "jane.smith@example.com",
                "phone": "+1987654321",
                "message": "Can I get more information about the villa in Malibu?",
                "inquiry_type": "property"
            },
            {
                "name": "Bob Johnson",
                "email": "bob.johnson@example.com", 
                "phone": "+1555123456",
                "message": "I need a property valuation for my home",
                "inquiry_type": "valuation"
            }
        ]
        
        results = []
        for inquiry in test_inquiries:
            success, data = self.run_test(
                f"Create {inquiry['inquiry_type'].title()} Inquiry",
                "POST",
                "/api/inquiries",
                200,
                inquiry
            )
            results.append(success)
        
        return all(results)
    
    def test_whatsapp_config(self):
        """Test WhatsApp configuration endpoint"""
        return self.run_test(
            "Get WhatsApp Config",
            "GET",
            "/api/whatsapp/config",
            200
        )
    
    def test_protected_endpoints(self):
        """Test endpoints that require authentication"""
        protected_tests = [
            ("Get Stats (Protected)", "GET", "/api/stats", 401, None),
            ("Get Inquiries (Protected)", "GET", "/api/inquiries", 401, None),
            ("Create Property (Protected)", "POST", "/api/properties", 401, {"title": "Test"}),
            ("Update WhatsApp Config (Protected)", "PUT", "/api/whatsapp/config", 401, {"default_number": "test"})
        ]
        
        results = []
        for test_name, method, endpoint, expected_status, data in protected_tests:
            success, _ = self.run_test(test_name, method, endpoint, expected_status, data)
            results.append(success)
        
        return all(results)
    
    def test_admin_login(self):
        """Test admin authentication"""
        login_data = {
            "email": "admin@estatex.com",
            "password": "admin1234"
        }
        
        success, response_data = self.run_test(
            "Admin Login",
            "POST",
            "/api/admin/login",
            200,
            login_data
        )
        
        if success and response_data:
            # Store the token for subsequent tests
            self.admin_token = response_data.get('access_token')
            print(f"   🔑 Admin token obtained: {self.admin_token[:20]}...")
            return True, response_data
        
        return False, {}
    
    def test_admin_analytics(self):
        """Test admin analytics endpoint with authentication"""
        if not hasattr(self, 'admin_token') or not self.admin_token:
            print("   ⚠️  No admin token available, running login first...")
            success, _ = self.test_admin_login()
            if not success:
                return False, {}
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        return self.run_test(
            "Admin Analytics (with auth)",
            "GET",
            "/api/admin/analytics",
            200,
            headers=headers
        )
    
    def test_invalid_endpoints(self):
        """Test invalid/non-existent endpoints"""
        invalid_tests = [
            ("Non-existent Property", "GET", "/api/properties/invalid_id", 404, None),
            ("Invalid Inquiry Data", "POST", "/api/inquiries", 422, {"invalid": "data"})
        ]
        
        results = []
        for test_name, method, endpoint, expected_status, data in invalid_tests:
            success, _ = self.run_test(test_name, method, endpoint, expected_status, data)
            results.append(success)
        
        return all(results)

def main():
    print("🏠 Real Estate API Testing Suite")
    print("=" * 50)
    
    tester = RealEstateAPITester()
    
    # Test sequence
    test_results = {}
    
    print("\n📍 1. Testing Basic Connectivity")
    test_results['root'] = tester.test_root_endpoint()[0]
    
    print("\n🌱 2. Seeding Test Data")
    test_results['seed'] = tester.test_seed_data()[0]
    
    print("\n🏘️  3. Testing Property Endpoints")
    test_results['properties'] = tester.test_get_properties()[0]
    test_results['featured'] = tester.test_get_featured_properties()[0]
    test_results['filters'] = tester.test_get_properties_with_filters()
    test_results['single_property'] = tester.test_get_single_property()[0]
    
    print("\n📞 4. Testing Contact/Inquiry Endpoints")
    test_results['inquiries'] = tester.test_create_inquiry()
    
    print("\n💬 5. Testing WhatsApp Configuration")
    test_results['whatsapp'] = tester.test_whatsapp_config()[0]
    
    print("\n🔒 6. Testing Admin Authentication")
    test_results['admin_login'] = tester.test_admin_login()[0]
    test_results['admin_analytics'] = tester.test_admin_analytics()[0]
    
    print("\n🔒 7. Testing Protected Endpoints (should fail without auth)")
    test_results['protected'] = tester.test_protected_endpoints()
    
    print("\n❌ 8. Testing Invalid Requests")
    test_results['invalid'] = tester.test_invalid_endpoints()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    print("\n📋 Detailed Results:")
    for category, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {category.replace('_', ' ').title()}: {status}")
    
    # Return exit code
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())