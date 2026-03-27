# EstateX - Real Estate Lead Generation Platform

## Problem Statement
Build a lead generation website for the Real Estate industry with property listings, admin CMS, contact forms.

## Tech Stack
- Frontend: React, Tailwind CSS, React Router, Context API, Lucide Icons, Recharts
- Backend: FastAPI, Python, Motor (Async MongoDB), UUIDs
- Auth: Google OAuth (Users), JWT (Admin)
- Maps: Leaflet / React-Leaflet
- Storage: Emergent Object Storage (for image uploads)

## Core Features (All Implemented)
- Dynamic property listings with search, filters, and map view
- Full-text search across city, location, address, title, country, description (case-insensitive)
- Agent profiles with contact details
- Area highlights with ratings
- Contact inquiry forms (general, property-specific, valuation)
- Google OAuth user authentication
- User favorites/wishlist system (requires login)
- Admin Dashboard with full CRUD for Properties, Agents, Areas
- Property detail modal in Admin (click card to view all details)
- Property edit from Admin (inline form, pre-filled)
- Image upload via URL or local device (stored in object storage)
- Lead management with status dropdown (New, Contacted, Qualified, Negotiation, Closed-Won, Closed-Lost)
- CSV export for leads
- Email notifications (simulated without Resend API key)
- ScrollToTop on navigation
- Autocomplete search in properties

## Key API Endpoints
- GET/POST/PUT/DELETE /api/properties (search: ?city= with $or across multiple fields)
- GET/POST/PUT/DELETE /api/agents
- GET/POST/PUT/DELETE /api/areas
- GET/POST/DELETE /api/inquiries
- PUT /api/inquiries/{id}/read
- PUT /api/inquiries/{id}/status
- GET/POST/DELETE /api/favorites
- POST /api/upload (image upload to object storage)
- GET /api/files/{path} (serve uploaded images)
- POST /api/admin/login
- GET /api/admin/analytics

## Credentials
- Admin: admin@estatex.com / admin1234

## Backlog
- Refactor server.py into route modules (1500+ lines)
- Refactor AdminDashboard.js into sub-components (~950 lines)
