from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import requests

# Import email service
from email_service import EmailService

# Import admin authentication
from admin_auth import verify_password, get_password_hash, create_access_token, decode_access_token

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class PropertyBase(BaseModel):
    title: str
    title_es: Optional[str] = None
    title_zh: Optional[str] = None
    title_hi: Optional[str] = None
    title_ar: Optional[str] = None
    description: str
    description_es: Optional[str] = None
    description_zh: Optional[str] = None
    description_hi: Optional[str] = None
    description_ar: Optional[str] = None
    price: float
    currency: str = "USD"
    property_type: str  # apartment, house, villa, commercial, land
    bedrooms: int
    bathrooms: int
    area: float  # in sqft
    location: str
    address: str
    city: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    images: List[str] = []
    features: List[str] = []
    is_featured: bool = False
    status: str = "available"  # available, sold, rented
    whatsapp_number: Optional[str] = None

class PropertyCreate(PropertyBase):
    pass

class Property(PropertyBase):
    model_config = ConfigDict(extra="ignore")
    property_id: str = Field(default_factory=lambda: f"prop_{uuid.uuid4().hex[:12]}")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactInquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    inquiry_id: str = Field(default_factory=lambda: f"inq_{uuid.uuid4().hex[:12]}")
    property_id: Optional[str] = None
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    inquiry_type: str = "general"  # general, property, valuation
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_read: bool = False
    status: str = "New"  # New, Contacted, Qualified, Negotiation, Closed-Won, Closed-Lost

class ContactInquiryCreate(BaseModel):
    property_id: Optional[str] = None
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    inquiry_type: str = "general"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex[:12]}")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WhatsAppConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    config_id: str = Field(default_factory=lambda: f"wa_{uuid.uuid4().hex[:12]}")
    default_number: str
    default_message: str = "Hello! I'm interested in your properties."
    is_active: bool = True

# ==================== ADMIN AUTH MODELS ====================

class AdminUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    admin_id: str = Field(default_factory=lambda: f"admin_{uuid.uuid4().hex[:12]}")
    email: EmailStr
    hashed_password: str
    name: str
    role: str = "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: dict

# ==================== AGENT MODELS ====================

class AgentBase(BaseModel):
    name: str
    role: str  # Senior Broker, Investment Specialist, etc.
    specialization: str  # luxury, commercial, firstTime, etc.
    phone: str
    email: EmailStr
    bio: str
    image: str = ""
    stats_sales: str = "0+"
    stats_experience: str = "0"
    stats_rating: str = "5.0"

class AgentCreate(AgentBase):
    pass

class Agent(AgentBase):
    model_config = ConfigDict(extra="ignore")
    agent_id: str = Field(default_factory=lambda: f"agent_{uuid.uuid4().hex[:12]}")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AREA MODELS ====================

class AreaBase(BaseModel):
    name: str
    state: str
    description: str
    image: str = ""
    avg_price: str = "$0"
    properties_count: int = 0
    price_change: str = "+0%"
    highlights: List[str] = []
    walk_score: int = 0
    transit_score: int = 0
    bike_score: int = 0
    amenities: List[str] = []
    school_rating: float = 0.0
    safety_rating: float = 0.0
    lifestyle_rating: float = 0.0

class AreaCreate(AreaBase):
    pass

class Area(AreaBase):
    model_config = ConfigDict(extra="ignore")
    area_id: str = Field(default_factory=lambda: f"area_{uuid.uuid4().hex[:12]}")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== FAVORITE MODEL ====================

class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    favorite_id: str = Field(default_factory=lambda: f"fav_{uuid.uuid4().hex[:12]}")
    user_id: str
    property_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token in cookies or Authorization header"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    # Check expiry with timezone awareness
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    """Require authentication - raises 401 if not authenticated"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin_auth(request: Request):
    """Require admin authentication via Bearer token"""
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return payload

async def require_auth_or_admin(request: Request):
    """Accept either user session OR admin Bearer token"""
    # Try admin auth first (Bearer token)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = decode_access_token(token)
        if payload and payload.get("role") == "admin":
            return payload
    
    # Fall back to regular user auth (session cookie)
    user = await get_current_user(request)
    if user:
        return user
    
    raise HTTPException(status_code=401, detail="Not authenticated")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token after Google OAuth"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client_http:
        try:
            auth_response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            auth_data = auth_response.json()
        except httpx.RequestError as e:
            logger.error(f"Auth request failed: {e}")
            raise HTTPException(status_code=500, detail="Authentication service unavailable")
    
    user_email = auth_data.get("email")
    user_name = auth_data.get("name")
    user_picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")

    if not user_email or not session_token:
        raise HTTPException(status_code=502, detail="Authentication failed: incomplete data from auth service")

    # Check if user exists
    existing_user = await db.users.find_one({"email": user_email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": user_name, "picture": user_picture}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": user_email,
            "name": user_name,
            "picture": user_picture,
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
        
        # Send welcome email to new user
        try:
            await EmailService.send_welcome_email(
                name=user_name,
                email=user_email
            )
        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "session_id": f"sess_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_current_user_route(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user - clear session"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== ADMIN AUTH ROUTES ====================

@api_router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(credentials: AdminLoginRequest):
    """Admin login with email and password"""
    # Find admin user by email
    admin_user = await db.admin_users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not admin_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(credentials.password, admin_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if admin is active
    if not admin_user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Admin account is disabled")
    
    # Create JWT token
    access_token = create_access_token(
        data={"sub": admin_user["email"], "admin_id": admin_user["admin_id"], "role": "admin"}
    )
    
    # Return token and admin info (without password)
    admin_data = {
        "admin_id": admin_user["admin_id"],
        "email": admin_user["email"],
        "name": admin_user["name"],
        "role": admin_user["role"]
    }
    
    return AdminLoginResponse(
        access_token=access_token,
        admin=admin_data
    )

@api_router.get("/admin/me")
async def get_admin_me(request: Request):
    """Get current admin user info from token"""
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    admin_id = payload.get("admin_id")
    if not admin_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    admin_user = await db.admin_users.find_one({"admin_id": admin_id}, {"_id": 0, "hashed_password": 0})
    
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return admin_user

@api_router.get("/admin/analytics")
async def get_admin_analytics(request: Request):
    """Get analytics data for admin dashboard"""
    # Verify admin authentication
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get analytics data
    total_properties = await db.properties.count_documents({})
    total_inquiries = await db.inquiries.count_documents({})
    unread_inquiries = await db.inquiries.count_documents({"is_read": False})
    
    # Properties by type
    pipeline_type = [
        {"$group": {"_id": "$property_type", "count": {"$sum": 1}}}
    ]
    properties_by_type = await db.properties.aggregate(pipeline_type).to_list(100)
    
    # Properties by status
    pipeline_status = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    properties_by_status = await db.properties.aggregate(pipeline_status).to_list(100)
    
    # Inquiries by type
    pipeline_inquiry_type = [
        {"$group": {"_id": "$inquiry_type", "count": {"$sum": 1}}}
    ]
    inquiries_by_type = await db.inquiries.aggregate(pipeline_inquiry_type).to_list(100)
    
    # Recent inquiries trend (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    pipeline_trend = [
        {"$match": {"created_at": {"$gte": seven_days_ago.isoformat()}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": {"$toDate": "$created_at"}}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    inquiries_trend = await db.inquiries.aggregate(pipeline_trend).to_list(100)
    
    return {
        "total_properties": total_properties,
        "total_inquiries": total_inquiries,
        "unread_inquiries": unread_inquiries,
        "properties_by_type": properties_by_type,
        "properties_by_status": properties_by_status,
        "inquiries_by_type": inquiries_by_type,
        "inquiries_trend": inquiries_trend
    }

# ==================== PROPERTY ROUTES ====================

@api_router.get("/properties", response_model=List[Property])
async def get_properties(
    property_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    featured: Optional[bool] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get all properties with optional filters"""
    query = {}
    
    if property_type:
        query["property_type"] = property_type
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query["price"] = {**query.get("price", {}), "$lte": max_price}
    if bedrooms is not None:
        # Handle "5+" as 5 or more bedrooms
        if bedrooms == "5":
            query["bedrooms"] = {"$gte": 5}
        else:
            try:
                query["bedrooms"] = int(bedrooms)
            except ValueError:
                pass  # Invalid bedroom value, skip filter
    if city:
        query["$or"] = [
            {"city": {"$regex": city, "$options": "i"}},
            {"location": {"$regex": city, "$options": "i"}},
            {"address": {"$regex": city, "$options": "i"}},
            {"title": {"$regex": city, "$options": "i"}},
            {"country": {"$regex": city, "$options": "i"}},
            {"description": {"$regex": city, "$options": "i"}}
        ]
    if status:
        query["status"] = status
    if featured is not None:
        query["is_featured"] = featured
    
    properties = await db.properties.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return properties

@api_router.get("/properties/{property_id}", response_model=Property)
async def get_property(property_id: str):
    """Get a single property by ID"""
    property_doc = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    return property_doc

@api_router.post("/properties", response_model=Property)
async def create_property(property_data: PropertyCreate, user = Depends(require_auth_or_admin)):
    """Create a new property (admin only)"""
    property_obj = Property(**property_data.model_dump())
    doc = property_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.properties.insert_one(doc)
    return property_obj

@api_router.put("/properties/{property_id}", response_model=Property)
async def update_property(property_id: str, property_data: PropertyCreate, user = Depends(require_auth_or_admin)):
    """Update a property (admin only)"""
    existing = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    
    update_data = property_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.properties.update_one(
        {"property_id": property_id},
        {"$set": update_data}
    )
    
    updated = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    return updated

@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str, user = Depends(require_auth_or_admin)):
    """Delete a property (admin only)"""
    result = await db.properties.delete_one({"property_id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Property deleted successfully"}

# ==================== CONTACT/INQUIRY ROUTES ====================

@api_router.post("/inquiries", response_model=ContactInquiry)
async def create_inquiry(inquiry_data: ContactInquiryCreate):
    """Create a new contact inquiry and send email notifications"""
    inquiry_obj = ContactInquiry(**inquiry_data.model_dump())
    doc = inquiry_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.inquiries.insert_one(doc)
    
    # Send email notifications asynchronously
    try:
        # Check if this is a property-specific inquiry
        if inquiry_obj.property_id:
            # Get property details for the email
            property_doc = await db.properties.find_one(
                {"property_id": inquiry_obj.property_id},
                {"_id": 0, "title": 1, "price": 1, "property_id": 1}
            )
            
            if property_doc:
                # Send property inquiry notification to admin
                await EmailService.send_property_inquiry_notification(
                    name=inquiry_obj.name,
                    email=inquiry_obj.email,
                    phone=inquiry_obj.phone,
                    message=inquiry_obj.message,
                    property_title=property_doc.get("title", "Unknown Property"),
                    property_id=inquiry_obj.property_id,
                    property_price=property_doc.get("price", 0)
                )
        
        # Check if this is a valuation request
        elif inquiry_obj.inquiry_type == "valuation":
            # Parse valuation details from message
            # Extract address, property_type, bedrooms from message
            message_lines = inquiry_obj.message.split('\n')
            address = ""
            property_type = "house"
            bedrooms = "3"
            additional_info = ""
            
            for line in message_lines:
                if "Address:" in line:
                    address = line.split("Address:")[-1].strip()
                elif "Type:" in line:
                    property_type = line.split("Type:")[-1].strip()
                elif "Bedrooms:" in line:
                    bedrooms = line.split("Bedrooms:")[-1].strip()
                elif "Additional Info:" in line:
                    additional_info = line.split("Additional Info:")[-1].strip()
            
            await EmailService.send_valuation_request_notification(
                name=inquiry_obj.name,
                email=inquiry_obj.email,
                phone=inquiry_obj.phone,
                address=address,
                property_type=property_type,
                bedrooms=bedrooms,
                message=additional_info
            )
        
        # General contact form
        else:
            # Send notification to admin
            await EmailService.send_contact_form_notification(
                name=inquiry_obj.name,
                email=inquiry_obj.email,
                phone=inquiry_obj.phone,
                message=inquiry_obj.message,
                inquiry_type=inquiry_obj.inquiry_type
            )
        
        # Send confirmation email to user
        await EmailService.send_contact_confirmation(
            name=inquiry_obj.name,
            email=inquiry_obj.email
        )
        
    except Exception as e:
        # Log email error but don't fail the inquiry creation
        logger.error(f"Failed to send email notifications: {str(e)}")
    
    return inquiry_obj

@api_router.get("/inquiries", response_model=List[ContactInquiry])
async def get_inquiries(
    property_id: Optional[str] = None,
    inquiry_type: Optional[str] = None,
    is_read: Optional[bool] = None,
    auth_user = Depends(require_auth_or_admin)
):
    """Get all inquiries (admin or authenticated user)"""
    query = {}
    if property_id:
        query["property_id"] = property_id
    if inquiry_type:
        query["inquiry_type"] = inquiry_type
    if is_read is not None:
        query["is_read"] = is_read
    
    inquiries = await db.inquiries.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return inquiries

@api_router.put("/inquiries/{inquiry_id}/read")
async def mark_inquiry_read(inquiry_id: str, auth_user = Depends(require_auth_or_admin)):
    """Mark an inquiry as read (admin only)"""
    result = await db.inquiries.update_one(
        {"inquiry_id": inquiry_id},
        {"$set": {"is_read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"message": "Inquiry marked as read"}

@api_router.put("/inquiries/{inquiry_id}/status")
async def update_inquiry_status(inquiry_id: str, body: dict, auth_user = Depends(require_auth_or_admin)):
    """Update the status of an inquiry (admin only)"""
    valid_statuses = ["New", "Contacted", "Qualified", "Negotiation", "Closed-Won", "Closed-Lost"]
    status = body.get("status")
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    result = await db.inquiries.update_one(
        {"inquiry_id": inquiry_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"message": "Status updated", "status": status}

@api_router.delete("/inquiries/{inquiry_id}")
async def delete_inquiry(inquiry_id: str, auth_user = Depends(require_auth_or_admin)):
    """Delete an inquiry (admin only)"""
    result = await db.inquiries.delete_one({"inquiry_id": inquiry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"message": "Inquiry deleted successfully"}

# ==================== AGENT ROUTES ====================

@api_router.get("/agents", response_model=List[Agent])
async def get_agents():
    """Get all agents"""
    agents = await db.agents.find({}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return agents

@api_router.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get a specific agent by ID"""
    agent = await db.agents.find_one({"agent_id": agent_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@api_router.post("/agents", response_model=Agent)
async def create_agent(agent_data: AgentCreate, user = Depends(require_auth_or_admin)):
    """Create a new agent (admin only)"""
    agent_obj = Agent(**agent_data.model_dump())
    doc = agent_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.agents.insert_one(doc)
    return agent_obj

@api_router.put("/agents/{agent_id}")
async def update_agent(agent_id: str, agent_data: AgentCreate, user = Depends(require_auth_or_admin)):
    """Update an agent (admin only)"""
    update_data = agent_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.agents.update_one(
        {"agent_id": agent_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    updated = await db.agents.find_one({"agent_id": agent_id}, {"_id": 0})
    return updated

@api_router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str, user = Depends(require_auth_or_admin)):
    """Delete an agent (admin only)"""
    result = await db.agents.delete_one({"agent_id": agent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted successfully"}

# ==================== AREA ROUTES ====================

@api_router.get("/areas", response_model=List[Area])
async def get_areas():
    """Get all areas"""
    areas = await db.areas.find({}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return areas

@api_router.get("/areas/{area_id}")
async def get_area(area_id: str):
    """Get a specific area by ID"""
    area = await db.areas.find_one({"area_id": area_id}, {"_id": 0})
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    return area

@api_router.post("/areas", response_model=Area)
async def create_area(area_data: AreaCreate, user = Depends(require_auth_or_admin)):
    """Create a new area (admin only)"""
    area_obj = Area(**area_data.model_dump())
    doc = area_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.areas.insert_one(doc)
    return area_obj

@api_router.put("/areas/{area_id}")
async def update_area(area_id: str, area_data: AreaCreate, user = Depends(require_auth_or_admin)):
    """Update an area (admin only)"""
    update_data = area_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.areas.update_one(
        {"area_id": area_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Area not found")
    
    updated = await db.areas.find_one({"area_id": area_id}, {"_id": 0})
    return updated

@api_router.delete("/areas/{area_id}")
async def delete_area(area_id: str, user = Depends(require_auth_or_admin)):
    """Delete an area (admin only)"""
    result = await db.areas.delete_one({"area_id": area_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Area not found")
    return {"message": "Area deleted successfully"}

# ==================== FAVORITES ROUTES ====================

@api_router.get("/favorites")
async def get_favorites(user: User = Depends(require_auth)):
    """Get all favorites for the current user"""
    favorites = await db.favorites.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    
    # Get the property details for each favorite
    property_ids = [f["property_id"] for f in favorites]
    properties = await db.properties.find({"property_id": {"$in": property_ids}}, {"_id": 0}).to_list(100)
    
    return {
        "favorites": favorites,
        "properties": properties
    }

@api_router.get("/favorites/ids")
async def get_favorite_ids(user: User = Depends(require_auth)):
    """Get just the property IDs of user's favorites (for quick checks)"""
    favorites = await db.favorites.find({"user_id": user.user_id}, {"_id": 0, "property_id": 1}).to_list(100)
    return {"property_ids": [f["property_id"] for f in favorites]}

@api_router.post("/favorites/{property_id}")
async def add_favorite(property_id: str, user: User = Depends(require_auth)):
    """Add a property to favorites"""
    # Check if property exists
    property_doc = await db.properties.find_one({"property_id": property_id})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Check if already favorited
    existing = await db.favorites.find_one({"user_id": user.user_id, "property_id": property_id})
    if existing:
        return {"message": "Already in favorites", "favorite_id": existing.get("favorite_id")}
    
    # Create favorite
    favorite = Favorite(user_id=user.user_id, property_id=property_id)
    doc = favorite.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.favorites.insert_one(doc)
    
    return {"message": "Added to favorites", "favorite_id": favorite.favorite_id}

@api_router.delete("/favorites/{property_id}")
async def remove_favorite(property_id: str, user: User = Depends(require_auth)):
    """Remove a property from favorites"""
    result = await db.favorites.delete_one({"user_id": user.user_id, "property_id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Removed from favorites"}

# ==================== WHATSAPP CONFIG ROUTES ====================

@api_router.get("/whatsapp/config")
async def get_whatsapp_config():
    """Get WhatsApp configuration"""
    config = await db.whatsapp_config.find_one({}, {"_id": 0})
    if not config:
        return {"default_number": "", "default_message": "Hello! I'm interested in your properties.", "is_active": True}
    return config

@api_router.put("/whatsapp/config")
async def update_whatsapp_config(config: WhatsAppConfig, user: User = Depends(require_auth)):
    """Update WhatsApp configuration (admin only)"""
    doc = config.model_dump()
    await db.whatsapp_config.replace_one({}, doc, upsert=True)
    return doc

# ==================== STATS ROUTES ====================

@api_router.get("/stats")
async def get_stats(user: User = Depends(require_auth)):
    """Get dashboard stats (admin only)"""
    total_properties = await db.properties.count_documents({})
    available_properties = await db.properties.count_documents({"status": "available"})
    sold_properties = await db.properties.count_documents({"status": "sold"})
    total_inquiries = await db.inquiries.count_documents({})
    unread_inquiries = await db.inquiries.count_documents({"is_read": False})
    
    return {
        "total_properties": total_properties,
        "available_properties": available_properties,
        "sold_properties": sold_properties,
        "total_inquiries": total_inquiries,
        "unread_inquiries": unread_inquiries
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed demo data once; a unique-_id lock serializes concurrent calls (StrictMode fires /api/seed twice) so they can't double-insert."""
    try:
        await db.seed_locks.insert_one({"_id": "seed"})
    except DuplicateKeyError:
        return {"message": "Seed already in progress"}
    try:
        return await _seed_data_impl()
    finally:
        await db.seed_locks.delete_one({"_id": "seed"})


async def _seed_data_impl():
    messages = []
    
    # Check and seed properties
    existing_props = await db.properties.count_documents({})
    if existing_props > 0:
        messages.append(f"{existing_props} properties already exist")
    else:
        sample_properties = [
            {
            "property_id": f"prop_{uuid.uuid4().hex[:12]}",
            "title": "Modern Luxury Villa",
            "title_es": "Villa de Lujo Moderna",
            "title_zh": "现代豪华别墅",
            "title_hi": "आधुनिक लक्जरी विला",
            "title_ar": "فيلا فاخرة حديثة",
            "description": "Stunning contemporary villa with panoramic ocean views. Features include infinity pool, smart home technology, and chef's kitchen.",
            "description_es": "Impresionante villa contemporánea con vistas panorámicas al océano. Incluye piscina infinita, tecnología de hogar inteligente y cocina de chef.",
            "description_zh": "令人惊叹的当代别墅，享有全景海景。设施包括无边泳池、智能家居技术和专业厨房。",
            "description_hi": "मनोरम समुद्र दृश्य के साथ आश्चर्यजनक समकालीन विला। सुविधाओं में इन्फिनिटी पूल, स्मार्ट होम तकनीक और शेफ की रसोई शामिल है।",
            "description_ar": "فيلا معاصرة مذهلة مع إطلالات بانورامية على المحيط. تشمل الميزات مسبح إنفينيتي وتقنية المنزل الذكي ومطبخ الشيف.",
            "price": 2500000,
            "currency": "USD",
            "property_type": "villa",
            "bedrooms": 5,
            "bathrooms": 6,
            "area": 5500,
            "location": "Malibu, California",
            "address": "123 Pacific Coast Highway",
            "city": "Malibu",
            "country": "USA",
            "latitude": 34.0259,
            "longitude": -118.7798,
            "images": [
                "https://images.unsplash.com/photo-1622015663319-e97e697503ee?w=800&q=80",
                "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"
            ],
            "features": ["Pool", "Ocean View", "Smart Home", "Garage", "Garden"],
            "is_featured": True,
            "status": "available",
            "whatsapp_number": "+1234567890",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "property_id": f"prop_{uuid.uuid4().hex[:12]}",
            "title": "Downtown Penthouse",
            "title_es": "Ático en el Centro",
            "title_zh": "市中心顶层公寓",
            "title_hi": "डाउनटाउन पेंटहाउस",
            "title_ar": "بنتهاوس وسط المدينة",
            "description": "Exclusive penthouse in the heart of downtown. Floor-to-ceiling windows, private terrace, and world-class amenities.",
            "description_es": "Exclusivo ático en el corazón del centro. Ventanas del piso al techo, terraza privada y comodidades de clase mundial.",
            "description_zh": "市中心独家顶层公寓。落地窗、私人露台和世界级设施。",
            "description_hi": "डाउनटाउन के केंद्र में विशेष पेंटहाउस। फ्लोर-टू-सीलिंग खिड़कियां, निजी छत और विश्व स्तरीय सुविधाएं।",
            "description_ar": "بنتهاوس حصري في قلب وسط المدينة. نوافذ من الأرض حتى السقف وتراس خاص ووسائل راحة عالمية المستوى.",
            "price": 1800000,
            "currency": "USD",
            "property_type": "apartment",
            "bedrooms": 3,
            "bathrooms": 3,
            "area": 3200,
            "location": "Manhattan, New York",
            "address": "456 Park Avenue",
            "city": "New York",
            "country": "USA",
            "latitude": 40.7580,
            "longitude": -73.9855,
            "images": [
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"
            ],
            "features": ["City View", "Terrace", "Gym", "Concierge", "Parking"],
            "is_featured": True,
            "status": "available",
            "whatsapp_number": "+1234567890",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "property_id": f"prop_{uuid.uuid4().hex[:12]}",
            "title": "Mediterranean Estate",
            "title_es": "Finca Mediterránea",
            "title_zh": "地中海庄园",
            "title_hi": "भूमध्यसागरीय संपदा",
            "title_ar": "عقار البحر الأبيض المتوسط",
            "description": "Elegant Mediterranean-style estate on 2 acres. Features vineyard, guest house, and resort-style pool.",
            "description_es": "Elegante finca de estilo mediterráneo en 2 acres. Incluye viñedo, casa de huéspedes y piscina estilo resort.",
            "description_zh": "占地2英亩的优雅地中海风格庄园。设有葡萄园、客房和度假村式泳池。",
            "description_hi": "2 एकड़ में सुरुचिपूर्ण भूमध्यसागरीय शैली की संपदा। दाख की बारी, गेस्ट हाउस और रिसॉर्ट-शैली पूल शामिल है।",
            "description_ar": "عقار أنيق على الطراز المتوسطي على مساحة 2 فدان. يتميز بكرم ودار ضيافة ومسبح على طراز المنتجع.",
            "price": 3200000,
            "currency": "USD",
            "property_type": "house",
            "bedrooms": 6,
            "bathrooms": 7,
            "area": 7800,
            "location": "Santa Barbara, California",
            "address": "789 Vineyard Lane",
            "city": "Santa Barbara",
            "country": "USA",
            "latitude": 34.4208,
            "longitude": -119.6982,
            "images": [
                "https://images.unsplash.com/photo-1757439402359-aed14d39fc1b?w=800&q=80",
                "https://images.unsplash.com/photo-1611018399688-7a9bd5b67ca1?w=800&q=80"
            ],
            "features": ["Vineyard", "Guest House", "Pool", "Wine Cellar", "Garden"],
            "is_featured": True,
            "status": "available",
            "whatsapp_number": "+1234567890",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "property_id": f"prop_{uuid.uuid4().hex[:12]}",
            "title": "Urban Loft",
            "title_es": "Loft Urbano",
            "title_zh": "城市阁楼",
            "title_hi": "शहरी लॉफ्ट",
            "title_ar": "لوفت حضري",
            "description": "Industrial-chic loft in converted warehouse. Exposed brick, high ceilings, and open floor plan.",
            "description_es": "Loft industrial-chic en almacén convertido. Ladrillo expuesto, techos altos y planta abierta.",
            "description_zh": "改建仓库中的工业时尚阁楼。裸露砖墙、高天花板和开放式平面布局。",
            "description_hi": "परिवर्तित गोदाम में औद्योगिक-शैली लॉफ्ट। एक्सपोज्ड ईंट, ऊंची छत और ओपन फ्लोर प्लान।",
            "description_ar": "لوفت صناعي أنيق في مستودع محول. طوب مكشوف وأسقف عالية ومخطط أرضي مفتوح.",
            "price": 750000,
            "currency": "USD",
            "property_type": "apartment",
            "bedrooms": 2,
            "bathrooms": 2,
            "area": 1800,
            "location": "Brooklyn, New York",
            "address": "321 Industrial Ave",
            "city": "Brooklyn",
            "country": "USA",
            "latitude": 40.6782,
            "longitude": -73.9442,
            "images": [
                "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80",
                "https://images.unsplash.com/photo-1582219987680-44c29049f5aa?w=800&q=80"
            ],
            "features": ["Exposed Brick", "High Ceilings", "Rooftop Access", "Pet Friendly"],
            "is_featured": False,
            "status": "available",
            "whatsapp_number": "+1234567890",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "property_id": f"prop_{uuid.uuid4().hex[:12]}",
            "title": "Beachfront Condo",
            "title_es": "Condominio Frente al Mar",
            "title_zh": "海滨公寓",
            "title_hi": "समुद्र तट कोंडो",
            "title_ar": "شقة على الشاطئ",
            "description": "Wake up to ocean waves in this stunning beachfront condo. Direct beach access and sunset views.",
            "description_es": "Despierta con las olas del océano en este impresionante condominio frente al mar. Acceso directo a la playa y vistas al atardecer.",
            "description_zh": "在这间令人惊叹的海滨公寓中伴着海浪醒来。直达海滩和日落美景。",
            "description_hi": "इस शानदार समुद्र तट कोंडो में समुद्र की लहरों के साथ जागें। सीधी समुद्र तट पहुंच और सूर्यास्त दृश्य।",
            "description_ar": "استيقظ على أمواج المحيط في هذه الشقة المذهلة على الشاطئ. وصول مباشر إلى الشاطئ ومناظر غروب الشمس.",
            "price": 1200000,
            "currency": "USD",
            "property_type": "apartment",
            "bedrooms": 3,
            "bathrooms": 2,
            "area": 2100,
            "location": "Miami Beach, Florida",
            "address": "555 Ocean Drive",
            "city": "Miami Beach",
            "country": "USA",
            "latitude": 25.7617,
            "longitude": -80.1918,
            "images": [
                "https://images.unsplash.com/photo-1755734500526-ad16e45c0903?w=800&q=80",
                "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80"
            ],
            "features": ["Beach Access", "Ocean View", "Pool", "Balcony", "Gym"],
            "is_featured": True,
            "status": "available",
            "whatsapp_number": "+1234567890",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "property_id": f"prop_{uuid.uuid4().hex[:12]}",
            "title": "Mountain Retreat",
            "title_es": "Retiro en la Montaña",
            "title_zh": "山间静居",
            "title_hi": "पहाड़ी आश्रय",
            "title_ar": "ملاذ جبلي",
            "description": "Secluded mountain home with breathtaking valley views. Perfect for nature lovers seeking tranquility.",
            "description_es": "Casa de montaña aislada con impresionantes vistas al valle. Perfecta para amantes de la naturaleza que buscan tranquilidad.",
            "description_zh": "隐蔽的山间住宅，享有令人叹为观止的山谷景色。非常适合寻求宁静的自然爱好者。",
            "description_hi": "लुभावने घाटी दृश्यों के साथ एकांत पहाड़ी घर। शांति चाहने वाले प्रकृति प्रेमियों के लिए उपयुक्त।",
            "description_ar": "منزل جبلي منعزل مع إطلالات خلابة على الوادي. مثالي لمحبي الطبيعة الباحثين عن الهدوء.",
            "price": 890000,
            "currency": "USD",
            "property_type": "house",
            "bedrooms": 4,
            "bathrooms": 3,
            "area": 3500,
            "location": "Aspen, Colorado",
            "address": "888 Mountain View Road",
            "city": "Aspen",
            "country": "USA",
            "latitude": 39.1911,
            "longitude": -106.8175,
            "images": [
                "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80",
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
            ],
            "features": ["Mountain View", "Fireplace", "Hot Tub", "Ski Access", "Garage"],
            "is_featured": False,
            "status": "available",
            "whatsapp_number": "+1234567890",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        ]
    
        await db.properties.insert_many(sample_properties)
        messages.append(f"Seeded {len(sample_properties)} properties")
    
    # Seed WhatsApp config
    whatsapp_config = {
        "config_id": f"wa_{uuid.uuid4().hex[:12]}",
        "default_number": "+1234567890",
        "default_message": "Hello! I'm interested in your properties.",
        "is_active": True
    }
    await db.whatsapp_config.replace_one({}, whatsapp_config, upsert=True)
    
    # Seed Agents
    existing_agents = await db.agents.count_documents({})
    if existing_agents == 0:
        sample_agents = [
            {
                "agent_id": f"agent_{uuid.uuid4().hex[:12]}",
                "name": "Sarah Chen",
                "role": "Senior Broker",
                "specialization": "Luxury Properties",
                "phone": "+00000-00000",
                "email": "sarah@example.com",
                "bio": "With over 15 years of experience in luxury real estate, Sarah has helped hundreds of clients find their dream homes in the most prestigious neighborhoods.",
                "image": "https://images.unsplash.com/photo-1758518727592-706e80ebc354?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
                "stats_sales": "250+",
                "stats_experience": "15",
                "stats_rating": "4.9",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "agent_id": f"agent_{uuid.uuid4().hex[:12]}",
                "name": "Michael Rodriguez",
                "role": "Investment Specialist",
                "specialization": "Commercial Properties",
                "phone": "+00000-00001",
                "email": "michael@example.com",
                "bio": "Michael specializes in commercial real estate investments, helping investors maximize their returns through strategic property acquisitions.",
                "image": "https://images.unsplash.com/photo-1758518727984-17b37f2f0562?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
                "stats_sales": "180+",
                "stats_experience": "12",
                "stats_rating": "4.8",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "agent_id": f"agent_{uuid.uuid4().hex[:12]}",
                "name": "Elena Williams",
                "role": "Client Relations",
                "specialization": "First-Time Buyers",
                "phone": "+00000-00002",
                "email": "elena@example.com",
                "bio": "Elena is passionate about helping first-time buyers navigate the real estate market with confidence and find their perfect starter home.",
                "image": "https://images.unsplash.com/photo-1758691737587-7630b4d31d16?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
                "stats_sales": "320+",
                "stats_experience": "10",
                "stats_rating": "5.0",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "agent_id": f"agent_{uuid.uuid4().hex[:12]}",
                "name": "David Kim",
                "role": "Market Analyst",
                "specialization": "Property Valuation",
                "phone": "+00000-00003",
                "email": "david@example.com",
                "bio": "David combines deep market analysis with real-world experience to provide accurate property valuations and investment insights.",
                "image": "https://images.unsplash.com/photo-1758518729286-e8d94cc231f5?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
                "stats_sales": "150+",
                "stats_experience": "8",
                "stats_rating": "4.9",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "agent_id": f"agent_{uuid.uuid4().hex[:12]}",
                "name": "Amanda Foster",
                "role": "Luxury Homes Specialist",
                "specialization": "Waterfront Properties",
                "phone": "+00000-00004",
                "email": "amanda@example.com",
                "bio": "Amanda specializes in waterfront and luxury properties, with an extensive portfolio of exclusive listings in prime coastal locations.",
                "image": "https://images.pexels.com/photos/6077567/pexels-photo-6077567.jpeg?auto=compress&cs=tinysrgb&w=800",
                "stats_sales": "200+",
                "stats_experience": "11",
                "stats_rating": "4.9",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "agent_id": f"agent_{uuid.uuid4().hex[:12]}",
                "name": "James Mitchell",
                "role": "Relocation Expert",
                "specialization": "Corporate Relocation",
                "phone": "+00000-00005",
                "email": "james@example.com",
                "bio": "James helps corporate clients and families relocating to new cities find the perfect home that meets their unique needs.",
                "image": "https://images.pexels.com/photos/7792860/pexels-photo-7792860.jpeg?auto=compress&cs=tinysrgb&w=800",
                "stats_sales": "175+",
                "stats_experience": "9",
                "stats_rating": "4.8",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.agents.insert_many(sample_agents)
        messages.append(f"Seeded {len(sample_agents)} agents")
    else:
        messages.append(f"{existing_agents} agents already exist")

    # Seed Areas
    existing_areas = await db.areas.count_documents({})
    if existing_areas == 0:
        sample_areas = [
            {
                "area_id": f"area_{uuid.uuid4().hex[:12]}",
                "name": "Malibu",
                "state": "California",
                "description": "Experience the ultimate California lifestyle with beachfront properties and stunning ocean views.",
                "image": "https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?w=800&q=80",
                "avg_price": "$4.5M",
                "properties_count": 45,
                "price_change": "+8%",
                "highlights": ["beachfront", "gatedCommunities", "celebrityNeighborhood", "surfing"],
                "walk_score": 45,
                "transit_score": 25,
                "bike_score": 55,
                "amenities": ["Private Beaches", "Hiking Trails", "Fine Dining", "Boutique Shopping"],
                "school_rating": 9.2,
                "safety_rating": 9.5,
                "lifestyle_rating": 9.8,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "area_id": f"area_{uuid.uuid4().hex[:12]}",
                "name": "Manhattan",
                "state": "New York",
                "description": "The heart of New York City offers unparalleled urban living with world-class dining, culture, and entertainment.",
                "image": "https://images.unsplash.com/photo-1478860409698-8707f4f0be41?w=800&q=80",
                "avg_price": "$2.8M",
                "properties_count": 120,
                "price_change": "+5%",
                "highlights": ["urbanLiving", "publicTransit", "cultural", "nightlife"],
                "walk_score": 98,
                "transit_score": 100,
                "bike_score": 70,
                "amenities": ["Central Park", "Broadway Theater", "World-Class Museums", "Michelin Restaurants"],
                "school_rating": 8.5,
                "safety_rating": 8.0,
                "lifestyle_rating": 9.5,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "area_id": f"area_{uuid.uuid4().hex[:12]}",
                "name": "Miami Beach",
                "state": "Florida",
                "description": "Vibrant tropical paradise with Art Deco architecture, white sand beaches, and year-round sunshine.",
                "image": "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800&q=80",
                "avg_price": "$1.9M",
                "properties_count": 85,
                "price_change": "+12%",
                "highlights": ["waterfront", "tropical", "nightlife", "investment"],
                "walk_score": 80,
                "transit_score": 65,
                "bike_score": 75,
                "amenities": ["Ocean Drive", "Art Deco District", "Yacht Clubs", "Night Markets"],
                "school_rating": 7.8,
                "safety_rating": 7.5,
                "lifestyle_rating": 9.2,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "area_id": f"area_{uuid.uuid4().hex[:12]}",
                "name": "Santa Barbara",
                "state": "California",
                "description": "The American Riviera offers Mediterranean climate, Spanish architecture, and wine country living.",
                "image": "https://images.unsplash.com/photo-1577584543879-e04fce809797?w=800&q=80",
                "avg_price": "$2.2M",
                "properties_count": 55,
                "price_change": "+7%",
                "highlights": ["wineCountry", "spanish", "beachAccess", "retirement"],
                "walk_score": 60,
                "transit_score": 35,
                "bike_score": 65,
                "amenities": ["Wine Tasting", "Historic Mission", "Farmers Markets", "Golf Courses"],
                "school_rating": 9.0,
                "safety_rating": 9.3,
                "lifestyle_rating": 9.4,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "area_id": f"area_{uuid.uuid4().hex[:12]}",
                "name": "Aspen",
                "state": "Colorado",
                "description": "World-renowned ski resort destination with luxury mountain properties and year-round outdoor activities.",
                "image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
                "avg_price": "$5.2M",
                "properties_count": 30,
                "price_change": "+10%",
                "highlights": ["skiing", "luxury", "mountain", "exclusive"],
                "walk_score": 50,
                "transit_score": 30,
                "bike_score": 45,
                "amenities": ["Ski Resorts", "Hiking Trails", "Hot Springs", "Fine Dining"],
                "school_rating": 8.8,
                "safety_rating": 9.7,
                "lifestyle_rating": 9.6,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "area_id": f"area_{uuid.uuid4().hex[:12]}",
                "name": "Brooklyn",
                "state": "New York",
                "description": "From brownstones to modern condos, Brooklyn offers diverse living options with artistic flair.",
                "image": "https://images.unsplash.com/photo-1452796651103-7c07fca7a2c1?w=800&q=80",
                "avg_price": "$1.2M",
                "properties_count": 95,
                "price_change": "+6%",
                "highlights": ["diversity", "restaurants", "parkAccess", "growingMarket"],
                "walk_score": 95,
                "transit_score": 89,
                "bike_score": 80,
                "amenities": ["Prospect Park", "Brooklyn Bridge", "Art Galleries", "Food Markets"],
                "school_rating": 7.6,
                "safety_rating": 7.2,
                "lifestyle_rating": 8.9,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.areas.insert_many(sample_areas)
        messages.append(f"Seeded {len(sample_areas)} areas")
    else:
        messages.append(f"{existing_areas} areas already exist")

    return {"message": "; ".join(messages)}

# ==================== EMAIL TESTING ====================

@api_router.post("/test-email")
async def test_email_endpoint(
    email_type: str = "contact",
    recipient_email: str = "test@example.com"
):
    """
    Test email functionality (for development/testing)
    
    email_type options:
    - contact: Test contact form notification
    - confirmation: Test user confirmation email
    - property: Test property inquiry notification
    - valuation: Test valuation request notification
    - welcome: Test welcome email
    """
    try:
        if email_type == "contact":
            result = await EmailService.send_contact_form_notification(
                name="John Doe",
                email=recipient_email,
                phone="+1 (555) 123-4567",
                message="I'm interested in learning more about your properties. Please contact me.",
                inquiry_type="general"
            )
        
        elif email_type == "confirmation":
            result = await EmailService.send_contact_confirmation(
                name="John Doe",
                email=recipient_email
            )
        
        elif email_type == "property":
            result = await EmailService.send_property_inquiry_notification(
                name="Jane Smith",
                email=recipient_email,
                phone="+1 (555) 987-6543",
                message="I would like to schedule a viewing for this property.",
                property_title="Modern Luxury Villa",
                property_id="prop_abc123",
                property_price=3500000
            )
        
        elif email_type == "valuation":
            result = await EmailService.send_valuation_request_notification(
                name="Bob Johnson",
                email=recipient_email,
                phone="+1 (555) 456-7890",
                address="123 Main Street, Beverly Hills, CA 90210",
                property_type="house",
                bedrooms="4",
                message="Looking to get an accurate market valuation for sale."
            )
        
        elif email_type == "welcome":
            result = await EmailService.send_welcome_email(
                name="Alice Williams",
                email=recipient_email
            )
        
        else:
            raise HTTPException(status_code=400, detail=f"Invalid email_type: {email_type}")
        
        return {
            "success": True,
            "email_type": email_type,
            "recipient": recipient_email,
            "result": result
        }
    
    except Exception as e:
        logger.error(f"Email test failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Email test failed: {str(e)}")

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "EstateX API - Real Estate Lead Generation Platform"}

# ==================== OBJECT STORAGE ====================
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "estatex"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp"
}

@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    if ext not in MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: .{ext}. Allowed: jpg, jpeg, png, gif, webp")
    content_type = MIME_TYPES.get(ext, "application/octet-stream")
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB")
    try:
        result = put_object(path, data, content_type)
    except requests.RequestException as e:
        logger.error(f"Image upload to storage failed: {e}")
        raise HTTPException(status_code=502, detail="Image upload failed. Please try again.")
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_init_admin():
    """Initialize default admin user on startup"""
    # Check if admin user already exists
    existing_admin = await db.admin_users.find_one({"email": "admin@estatex.com"})
    
    if not existing_admin:
        # Create default admin user
        admin_user = {
            "admin_id": f"admin_{uuid.uuid4().hex[:12]}",
            "email": "admin@estatex.com",
            "hashed_password": get_password_hash("admin1234"),
            "name": "EstateX Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        await db.admin_users.insert_one(admin_user)
        logger.info("Default admin user created: admin@estatex.com")
    else:
        logger.info("Admin user already exists")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

