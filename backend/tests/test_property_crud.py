"""
Test Property CRUD operations including the new PUT /api/properties/{property_id} endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://code-exec-3.preview.emergentagent.com').rstrip('/')

class TestPropertyCRUD:
    """Property CRUD endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin@estatex.com",
            "password": "admin1234"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.token = response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_get_properties(self):
        """Test GET /api/properties returns list of properties"""
        response = requests.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"Found {len(data)} properties")
    
    def test_get_single_property(self):
        """Test GET /api/properties/{property_id} returns property details"""
        # First get a property ID
        response = requests.get(f"{BASE_URL}/api/properties?limit=1")
        assert response.status_code == 200
        properties = response.json()
        assert len(properties) > 0
        
        property_id = properties[0]["property_id"]
        
        # Get single property
        response = requests.get(f"{BASE_URL}/api/properties/{property_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["property_id"] == property_id
        assert "title" in data
        assert "price" in data
        assert "description" in data
        print(f"Got property: {data['title']}")
    
    def test_get_nonexistent_property(self):
        """Test GET /api/properties/{property_id} returns 404 for non-existent property"""
        response = requests.get(f"{BASE_URL}/api/properties/prop_nonexistent123")
        assert response.status_code == 404
    
    def test_create_property(self):
        """Test POST /api/properties creates a new property"""
        new_property = {
            "title": "TEST Property for CRUD Test",
            "description": "This is a test property created by automated tests",
            "price": 999999,
            "property_type": "house",
            "bedrooms": 4,
            "bathrooms": 3,
            "area": 2500,
            "location": "Test City, Test State",
            "address": "123 Test Street",
            "city": "Test City",
            "country": "USA",
            "images": ["https://example.com/test.jpg"],
            "features": ["Test Feature 1", "Test Feature 2"],
            "is_featured": False,
            "status": "available",
            "whatsapp_number": "+1234567890"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/properties",
            json=new_property,
            headers=self.headers
        )
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "property_id" in data
        assert data["title"] == new_property["title"]
        assert data["price"] == new_property["price"]
        
        # Store for cleanup
        self.created_property_id = data["property_id"]
        print(f"Created property: {data['property_id']}")
        
        # Cleanup - delete the test property
        delete_response = requests.delete(
            f"{BASE_URL}/api/properties/{self.created_property_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        print(f"Cleaned up test property: {self.created_property_id}")
    
    def test_update_property(self):
        """Test PUT /api/properties/{property_id} updates a property"""
        # First create a test property
        new_property = {
            "title": "TEST Property for Update Test",
            "description": "Original description",
            "price": 500000,
            "property_type": "apartment",
            "bedrooms": 2,
            "bathrooms": 1,
            "area": 1000,
            "location": "Original Location",
            "address": "Original Address",
            "city": "Original City",
            "country": "USA",
            "images": [],
            "features": ["Original Feature"],
            "is_featured": False,
            "status": "available",
            "whatsapp_number": ""
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/properties",
            json=new_property,
            headers=self.headers
        )
        assert create_response.status_code == 200
        property_id = create_response.json()["property_id"]
        print(f"Created test property: {property_id}")
        
        # Update the property
        updated_property = {
            "title": "TEST Property UPDATED",
            "description": "Updated description",
            "price": 600000,
            "property_type": "apartment",
            "bedrooms": 3,
            "bathrooms": 2,
            "area": 1200,
            "location": "Updated Location",
            "address": "Updated Address",
            "city": "Updated City",
            "country": "USA",
            "images": ["https://example.com/updated.jpg"],
            "features": ["Updated Feature 1", "Updated Feature 2"],
            "is_featured": True,
            "status": "sold",
            "whatsapp_number": "+9876543210"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/properties/{property_id}",
            json=updated_property,
            headers=self.headers
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        data = update_response.json()
        
        # Verify update response
        assert data["title"] == updated_property["title"]
        assert data["price"] == updated_property["price"]
        assert data["bedrooms"] == updated_property["bedrooms"]
        assert data["status"] == updated_property["status"]
        assert data["is_featured"] == updated_property["is_featured"]
        print(f"Updated property title to: {data['title']}")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/properties/{property_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == updated_property["title"]
        assert fetched["price"] == updated_property["price"]
        print("Verified update persisted in database")
        
        # Cleanup
        delete_response = requests.delete(
            f"{BASE_URL}/api/properties/{property_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        print(f"Cleaned up test property: {property_id}")
    
    def test_update_nonexistent_property(self):
        """Test PUT /api/properties/{property_id} returns 404 for non-existent property"""
        update_data = {
            "title": "Test",
            "description": "Test",
            "price": 100000,
            "property_type": "house",
            "bedrooms": 1,
            "bathrooms": 1,
            "area": 500,
            "location": "Test",
            "address": "Test",
            "city": "Test",
            "country": "USA",
            "images": [],
            "features": [],
            "is_featured": False,
            "status": "available",
            "whatsapp_number": ""
        }
        
        response = requests.put(
            f"{BASE_URL}/api/properties/prop_nonexistent123",
            json=update_data,
            headers=self.headers
        )
        assert response.status_code == 404
    
    def test_update_property_without_auth(self):
        """Test PUT /api/properties/{property_id} requires authentication"""
        # Get a property ID
        response = requests.get(f"{BASE_URL}/api/properties?limit=1")
        property_id = response.json()[0]["property_id"]
        
        update_data = {
            "title": "Unauthorized Update",
            "description": "Test",
            "price": 100000,
            "property_type": "house",
            "bedrooms": 1,
            "bathrooms": 1,
            "area": 500,
            "location": "Test",
            "address": "Test",
            "city": "Test",
            "country": "USA",
            "images": [],
            "features": [],
            "is_featured": False,
            "status": "available",
            "whatsapp_number": ""
        }
        
        # Try without auth header
        response = requests.put(
            f"{BASE_URL}/api/properties/{property_id}",
            json=update_data
        )
        assert response.status_code == 401
    
    def test_delete_property(self):
        """Test DELETE /api/properties/{property_id} deletes a property"""
        # First create a test property
        new_property = {
            "title": "TEST Property for Delete Test",
            "description": "This will be deleted",
            "price": 100000,
            "property_type": "land",
            "bedrooms": 0,
            "bathrooms": 0,
            "area": 5000,
            "location": "Delete Test Location",
            "address": "Delete Test Address",
            "city": "Delete City",
            "country": "USA",
            "images": [],
            "features": [],
            "is_featured": False,
            "status": "available",
            "whatsapp_number": ""
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/properties",
            json=new_property,
            headers=self.headers
        )
        assert create_response.status_code == 200
        property_id = create_response.json()["property_id"]
        print(f"Created test property for deletion: {property_id}")
        
        # Delete the property
        delete_response = requests.delete(
            f"{BASE_URL}/api/properties/{property_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        print(f"Deleted property: {property_id}")
        
        # Verify deletion with GET
        get_response = requests.get(f"{BASE_URL}/api/properties/{property_id}")
        assert get_response.status_code == 404
        print("Verified property no longer exists")
    
    def test_delete_nonexistent_property(self):
        """Test DELETE /api/properties/{property_id} returns 404 for non-existent property"""
        response = requests.delete(
            f"{BASE_URL}/api/properties/prop_nonexistent123",
            headers=self.headers
        )
        assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
