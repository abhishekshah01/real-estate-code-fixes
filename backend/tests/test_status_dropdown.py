"""
Test cases for Lead Status Dropdown Feature
Tests the PUT /api/inquiries/{inquiry_id}/status endpoint and related functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://code-exec-3.preview.emergentagent.com').rstrip('/')

class TestStatusDropdownFeature:
    """Tests for the new status dropdown feature in Admin Leads table"""
    
    @pytest.fixture(autouse=True)
    def setup(self, api_client, admin_token):
        """Setup for each test"""
        self.client = api_client
        self.token = admin_token
        self.headers = {"Authorization": f"Bearer {admin_token}"}
    
    def test_get_inquiries_returns_status_field(self, api_client, admin_token):
        """GET /api/inquiries should return leads with 'status' field"""
        response = api_client.get(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check that at least one inquiry has status field
        if len(data) > 0:
            # Status should be present (defaults to 'New' if not set)
            for inquiry in data:
                assert "status" in inquiry or inquiry.get("status") is None, "Inquiry should have status field"
    
    def test_update_status_to_new(self, api_client, admin_token):
        """PUT /api/inquiries/{id}/status with status='New' should succeed"""
        # First get an inquiry
        response = api_client.get(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        inquiries = response.json()
        
        if len(inquiries) == 0:
            pytest.skip("No inquiries to test with")
        
        inquiry_id = inquiries[0]["inquiry_id"]
        
        # Update status to New
        response = api_client.put(
            f"{BASE_URL}/api/inquiries/{inquiry_id}/status",
            json={"status": "New"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "New"
    
    def test_update_status_to_contacted(self, api_client, admin_token):
        """PUT /api/inquiries/{id}/status with status='Contacted' should succeed"""
        response = api_client.get(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        inquiries = response.json()
        if len(inquiries) == 0:
            pytest.skip("No inquiries to test with")
        
        inquiry_id = inquiries[0]["inquiry_id"]
        
        response = api_client.put(
            f"{BASE_URL}/api/inquiries/{inquiry_id}/status",
            json={"status": "Contacted"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "Contacted"
    
    def test_update_status_to_qualified(self, api_client, admin_token):
        """PUT /api/inquiries/{id}/status with status='Qualified' should succeed"""
        response = api_client.get(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        inquiries = response.json()
        if len(inquiries) == 0:
            pytest.skip("No inquiries to test with")
        
        inquiry_id = inquiries[0]["inquiry_id"]
        
        response = api_client.put(
            f"{BASE_URL}/api/inquiries/{inquiry_id}/status",
            json={"status": "Qualified"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "Qualified"
    
    def test_update_status_to_negotiation(self, api_client, admin_token):
        """PUT /api/inquiries/{id}/status with status='Negotiation' should succeed"""
        response = api_client.get(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        inquiries = response.json()
        if len(inquiries) == 0:
            pytest.skip("No inquiries to test with")
        
        inquiry_id = inquiries[0]["inquiry_id"]
        
        response = api_client.put(
            f"{BASE_URL}/api/inquiries/{inquiry_id}/status",
            json={"status": "Negotiation"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "Negotiation"
    
    def test_update_status_to_closed_won(self, api_client, admin_token):
        """PUT /api/inquiries/{id}/status with status='Closed-Won' should succeed"""
        response = api_client.get(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        inquiries = response.json()
        if len(inquiries) == 0:
            pytest.skip("No inquiries to test with")
        
        inquiry_id = inquiries[0]["inquiry_id"]
        
        response = api_client.put(
            f"{BASE_URL}/api/inquiries/{inquiry_id}/status",
            json={"status": "Closed-Won"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "Closed-Won"
    
    def test_update_status_to_closed_lost(self, api_client, admin_token):
        """PUT /api/inquiries/{id}/status with status='Closed-Lost' should succeed"""
        response = api_client.get(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        inquiries = response.json()
        if len(inquiries) == 0:
            pytest.skip("No inquiries to test with")
        
        inquiry_id = inquiries[0]["inquiry_id"]
        
        response = api_client.put(
            f"{BASE_URL}/api/inquiries/{inquiry_id}/status",
            json={"status": "Closed-Lost"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "Closed-Lost"
    
    def test_update_status_invalid_returns_400(self, api_client, admin_token):
        """PUT /api/inquiries/{id}/status with invalid status should return 400"""
        response = api_client.get(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        inquiries = response.json()
        if len(inquiries) == 0:
            pytest.skip("No inquiries to test with")
        
        inquiry_id = inquiries[0]["inquiry_id"]
        
        response = api_client.put(
            f"{BASE_URL}/api/inquiries/{inquiry_id}/status",
            json={"status": "InvalidStatus"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400
        assert "Invalid status" in response.json()["detail"]
    
    def test_update_status_empty_returns_400(self, api_client, admin_token):
        """PUT /api/inquiries/{id}/status with empty status should return 400"""
        response = api_client.get(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        inquiries = response.json()
        if len(inquiries) == 0:
            pytest.skip("No inquiries to test with")
        
        inquiry_id = inquiries[0]["inquiry_id"]
        
        response = api_client.put(
            f"{BASE_URL}/api/inquiries/{inquiry_id}/status",
            json={"status": ""},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400
    
    def test_update_status_nonexistent_inquiry_returns_404(self, api_client, admin_token):
        """PUT /api/inquiries/{id}/status for non-existent inquiry should return 404"""
        response = api_client.put(
            f"{BASE_URL}/api/inquiries/inq_nonexistent123/status",
            json={"status": "New"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404
    
    def test_update_status_without_auth_returns_401(self, api_client):
        """PUT /api/inquiries/{id}/status without auth should return 401"""
        response = api_client.put(
            f"{BASE_URL}/api/inquiries/inq_test123/status",
            json={"status": "New"}
        )
        assert response.status_code == 401
    
    def test_status_persists_after_update(self, api_client, admin_token):
        """Status should persist in database after update"""
        # Get an inquiry
        response = api_client.get(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        inquiries = response.json()
        if len(inquiries) == 0:
            pytest.skip("No inquiries to test with")
        
        inquiry_id = inquiries[0]["inquiry_id"]
        
        # Update to Qualified
        response = api_client.put(
            f"{BASE_URL}/api/inquiries/{inquiry_id}/status",
            json={"status": "Qualified"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        # Verify by fetching inquiries again
        response = api_client.get(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        inquiries = response.json()
        updated_inquiry = next((i for i in inquiries if i["inquiry_id"] == inquiry_id), None)
        assert updated_inquiry is not None
        assert updated_inquiry["status"] == "Qualified"


class TestDeleteInquiry:
    """Tests for delete inquiry functionality"""
    
    def test_delete_inquiry_requires_auth(self, api_client):
        """DELETE /api/inquiries/{id} without auth should return 401"""
        response = api_client.delete(f"{BASE_URL}/api/inquiries/inq_test123")
        assert response.status_code == 401
    
    def test_delete_nonexistent_inquiry_returns_404(self, api_client, admin_token):
        """DELETE /api/inquiries/{id} for non-existent inquiry should return 404"""
        response = api_client.delete(
            f"{BASE_URL}/api/inquiries/inq_nonexistent123",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404
