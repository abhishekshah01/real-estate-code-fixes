import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://code-exec-3.preview.emergentagent.com').rstrip('/')


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self, api_client):
        """Test admin login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin@estatex.com",
            "password": "admin1234"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "admin" in data
        assert data["admin"]["email"] == "admin@estatex.com"
    
    def test_admin_login_invalid_password(self, api_client):
        """Test admin login with invalid password"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin@estatex.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        assert "Invalid credentials" in response.json().get("detail", "")
    
    def test_admin_login_invalid_email(self, api_client):
        """Test admin login with non-existent email"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={
            "email": "nonexistent@example.com",
            "password": "test1234"
        })
        assert response.status_code == 401
    
    def test_admin_me_with_valid_token(self, authenticated_client, admin_token):
        """Test getting admin info with valid token"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/me")
        assert response.status_code == 200
        data = response.json()
        assert "admin_id" in data
        assert data["email"] == "admin@estatex.com"
    
    def test_admin_me_without_token(self, api_client):
        """Test getting admin info without token"""
        response = api_client.get(f"{BASE_URL}/api/admin/me")
        assert response.status_code == 401


class TestAdminAnalytics:
    """Admin analytics endpoint tests"""
    
    def test_get_analytics_with_auth(self, authenticated_client):
        """Test getting analytics with valid auth"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/analytics")
        assert response.status_code == 200
        data = response.json()
        assert "total_properties" in data
        assert "total_inquiries" in data
        assert "unread_inquiries" in data
        assert "properties_by_type" in data
        assert "properties_by_status" in data
    
    def test_get_analytics_without_auth(self, api_client):
        """Test getting analytics without auth should fail"""
        response = api_client.get(f"{BASE_URL}/api/admin/analytics")
        assert response.status_code == 401
