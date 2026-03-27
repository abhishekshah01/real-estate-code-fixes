"""
Test Image Upload and File Serving Endpoints
Tests for iteration 9: Image URL and local device upload for properties
"""
import pytest
import requests
import os
import io
from PIL import Image

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://code-exec-3.preview.emergentagent.com').rstrip('/')

class TestImageUpload:
    """Tests for POST /api/upload endpoint"""
    
    @pytest.fixture
    def test_image_bytes(self):
        """Create a test image in memory"""
        img = Image.new('RGB', (100, 100), color='red')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        buffer.seek(0)
        return buffer.getvalue()
    
    @pytest.fixture
    def test_png_bytes(self):
        """Create a test PNG image in memory"""
        img = Image.new('RGBA', (100, 100), color='blue')
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        return buffer.getvalue()
    
    def test_upload_jpeg_image(self, test_image_bytes):
        """Test uploading a JPEG image"""
        files = {'file': ('test.jpg', test_image_bytes, 'image/jpeg')}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert 'path' in data
        assert 'url' in data
        assert data['path'].startswith('estatex/uploads/')
        assert data['path'].endswith('.jpg')
        assert data['url'].startswith('/api/files/')
        print(f"Uploaded JPEG: {data['url']}")
    
    def test_upload_png_image(self, test_png_bytes):
        """Test uploading a PNG image"""
        files = {'file': ('test.png', test_png_bytes, 'image/png')}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert 'path' in data
        assert 'url' in data
        assert data['path'].endswith('.png')
        print(f"Uploaded PNG: {data['url']}")
    
    def test_upload_returns_accessible_url(self, test_image_bytes):
        """Test that uploaded image URL is accessible"""
        # Upload image
        files = {'file': ('test.jpg', test_image_bytes, 'image/jpeg')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert upload_response.status_code == 200
        
        # Get the URL and fetch the image
        url = upload_response.json()['url']
        full_url = f"{BASE_URL}{url}"
        
        get_response = requests.get(full_url)
        assert get_response.status_code == 200
        assert get_response.headers.get('content-type') == 'image/jpeg'
        assert len(get_response.content) > 0
        print(f"Image accessible at: {full_url}")
    
    def test_upload_rejects_unsupported_file_type(self):
        """Test that unsupported file types are rejected"""
        files = {'file': ('test.txt', b'Hello World', 'text/plain')}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        
        assert response.status_code == 400
        data = response.json()
        assert 'detail' in data
        assert 'Unsupported file type' in data['detail']
        print(f"Correctly rejected: {data['detail']}")
    
    def test_upload_no_auth_required(self, test_image_bytes):
        """Test that upload endpoint does not require authentication"""
        # Upload without any auth headers
        files = {'file': ('test.jpg', test_image_bytes, 'image/jpeg')}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        
        # Should succeed without auth
        assert response.status_code == 200
        print("Upload works without authentication (as designed)")


class TestFileServing:
    """Tests for GET /api/files/{path} endpoint"""
    
    @pytest.fixture
    def uploaded_image_path(self):
        """Upload an image and return its path"""
        img = Image.new('RGB', (50, 50), color='green')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        buffer.seek(0)
        
        files = {'file': ('test.jpg', buffer.getvalue(), 'image/jpeg')}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert response.status_code == 200
        return response.json()['path']
    
    def test_serve_uploaded_file(self, uploaded_image_path):
        """Test serving an uploaded file"""
        response = requests.get(f"{BASE_URL}/api/files/{uploaded_image_path}")
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'image/jpeg'
        assert len(response.content) > 0
        print(f"File served successfully: {uploaded_image_path}")
    
    def test_serve_nonexistent_file_returns_404(self):
        """Test that non-existent files return 404"""
        response = requests.get(f"{BASE_URL}/api/files/estatex/uploads/nonexistent.jpg")
        
        assert response.status_code == 404
        print("Non-existent file correctly returns 404")


class TestPropertyWithUploadedImage:
    """Test creating a property with an uploaded image"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin@estatex.com",
            "password": "admin1234"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    def test_create_property_with_uploaded_image(self, admin_token):
        """Test creating a property with an uploaded image URL"""
        # First upload an image
        img = Image.new('RGB', (100, 100), color='purple')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        buffer.seek(0)
        
        files = {'file': ('property.jpg', buffer.getvalue(), 'image/jpeg')}
        upload_response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert upload_response.status_code == 200
        
        image_url = f"{BASE_URL}{upload_response.json()['url']}"
        
        # Create property with the uploaded image
        property_data = {
            "title": "TEST_Property_With_Upload",
            "description": "Test property with uploaded image",
            "price": 500000,
            "property_type": "house",
            "bedrooms": 3,
            "bathrooms": 2,
            "area": 2000,
            "location": "Test Location",
            "address": "123 Test St",
            "city": "Test City",
            "country": "USA",
            "images": [image_url],
            "features": ["Pool", "Garden"],
            "is_featured": False,
            "status": "available",
            "whatsapp_number": "+1234567890"
        }
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        create_response = requests.post(f"{BASE_URL}/api/properties", json=property_data, headers=headers)
        
        assert create_response.status_code == 200
        created = create_response.json()
        assert created['title'] == "TEST_Property_With_Upload"
        assert len(created['images']) == 1
        assert image_url in created['images'][0]
        
        property_id = created['property_id']
        print(f"Created property {property_id} with uploaded image")
        
        # Verify the image URL in the property is accessible
        img_response = requests.get(created['images'][0])
        assert img_response.status_code == 200
        print("Property image is accessible")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/properties/{property_id}", headers=headers)
        print(f"Cleaned up test property {property_id}")
