import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://code-exec-3.preview.emergentagent.com').rstrip('/')


class TestPropertiesRead:
    """Property read endpoints tests"""
    
    def test_get_all_properties(self, api_client):
        """Test getting all properties without filters"""
        response = api_client.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify property structure
        prop = data[0]
        assert "property_id" in prop
        assert "title" in prop
        assert "price" in prop
        assert "property_type" in prop
        assert "bedrooms" in prop
        assert "bathrooms" in prop
    
    def test_get_properties_by_type(self, api_client):
        """Test filtering properties by type"""
        response = api_client.get(f"{BASE_URL}/api/properties?property_type=house")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for prop in data:
            assert prop["property_type"] == "house"
    
    def test_get_featured_properties(self, api_client):
        """Test getting featured properties"""
        response = api_client.get(f"{BASE_URL}/api/properties?featured=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_single_property(self, api_client):
        """Test getting a single property by ID"""
        # First get a list to find a valid property_id
        list_response = api_client.get(f"{BASE_URL}/api/properties")
        assert list_response.status_code == 200
        properties = list_response.json()
        if len(properties) == 0:
            pytest.skip("No properties available")
        
        property_id = properties[0]["property_id"]
        response = api_client.get(f"{BASE_URL}/api/properties/{property_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["property_id"] == property_id
    
    def test_get_nonexistent_property(self, api_client):
        """Test getting a non-existent property returns 404"""
        response = api_client.get(f"{BASE_URL}/api/properties/nonexistent_prop_123")
        assert response.status_code == 404


class TestPropertiesCRUD:
    """Property CRUD operations (admin only)"""
    
    def test_create_property_without_auth(self, api_client):
        """Test creating property without auth should fail"""
        property_data = {
            "title": "TEST_Property",
            "description": "Test property",
            "price": 100000,
            "property_type": "house",
            "bedrooms": 3,
            "bathrooms": 2,
            "area": 1500,
            "location": "Test City",
            "address": "123 Test St",
            "city": "Test City",
            "country": "USA"
        }
        response = api_client.post(f"{BASE_URL}/api/properties", json=property_data)
        assert response.status_code == 401
    
    def test_create_and_delete_property(self, authenticated_client):
        """Test creating and deleting a property with admin auth"""
        unique_id = uuid.uuid4().hex[:8]
        property_data = {
            "title": f"TEST_Property_{unique_id}",
            "description": "Test property for automated testing",
            "price": 100000,
            "property_type": "house",
            "bedrooms": 3,
            "bathrooms": 2,
            "area": 1500,
            "location": "Test Location",
            "address": "123 Test St",
            "city": "Test City",
            "country": "USA"
        }
        
        # Create property
        create_response = authenticated_client.post(f"{BASE_URL}/api/properties", json=property_data)
        assert create_response.status_code == 200
        created_property = create_response.json()
        assert "property_id" in created_property
        assert created_property["title"] == property_data["title"]
        
        property_id = created_property["property_id"]
        
        # Verify it exists via GET
        get_response = authenticated_client.get(f"{BASE_URL}/api/properties/{property_id}")
        assert get_response.status_code == 200
        
        # Delete property
        delete_response = authenticated_client.delete(f"{BASE_URL}/api/properties/{property_id}")
        assert delete_response.status_code == 200
        
        # Verify it's deleted
        verify_response = authenticated_client.get(f"{BASE_URL}/api/properties/{property_id}")
        assert verify_response.status_code == 404


class TestInquiries:
    """Contact inquiry endpoints tests"""
    
    def test_create_inquiry(self, api_client):
        """Test creating a contact inquiry"""
        unique_id = uuid.uuid4().hex[:8]
        inquiry_data = {
            "name": f"TEST_User_{unique_id}",
            "email": f"test_{unique_id}@example.com",
            "phone": "+1555123456",
            "message": "Test inquiry message",
            "inquiry_type": "general"
        }
        
        response = api_client.post(f"{BASE_URL}/api/inquiries", json=inquiry_data)
        assert response.status_code == 200
        data = response.json()
        assert "inquiry_id" in data
        assert data["name"] == inquiry_data["name"]
        assert data["email"] == inquiry_data["email"]
    
    def test_create_property_inquiry(self, api_client):
        """Test creating a property-specific inquiry"""
        # First get a property ID
        props_response = api_client.get(f"{BASE_URL}/api/properties")
        if props_response.status_code != 200 or len(props_response.json()) == 0:
            pytest.skip("No properties available")
        
        property_id = props_response.json()[0]["property_id"]
        unique_id = uuid.uuid4().hex[:8]
        
        inquiry_data = {
            "property_id": property_id,
            "name": f"TEST_User_{unique_id}",
            "email": f"test_{unique_id}@example.com",
            "message": "Interested in this property",
            "inquiry_type": "property"
        }
        
        response = api_client.post(f"{BASE_URL}/api/inquiries", json=inquiry_data)
        assert response.status_code == 200
        data = response.json()
        assert data["property_id"] == property_id
        assert data["inquiry_type"] == "property"
    
    def test_get_inquiries_requires_auth(self, api_client):
        """Test that listing inquiries requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/inquiries")
        assert response.status_code == 401
    
    def test_get_inquiries_with_auth(self, authenticated_client):
        """Test getting inquiries with admin auth"""
        response = authenticated_client.get(f"{BASE_URL}/api/inquiries")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
