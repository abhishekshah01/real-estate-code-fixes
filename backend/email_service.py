"""
Email Service for Real Estate Website
Handles all email notifications using Resend API
"""

import os
import asyncio
import logging
from typing import Optional, Dict, Any
import resend
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Email Configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "noreply@yourdomain.com")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@yourdomain.com")

# Initialize Resend
if RESEND_API_KEY and RESEND_API_KEY != "your_resend_api_key_here":
    resend.api_key = RESEND_API_KEY
    logger.info("✅ Resend API initialized")
else:
    logger.warning("⚠️ RESEND_API_KEY not configured. Email sending will be simulated.")


class EmailService:
    """Email service for sending various types of notifications"""
    
    @staticmethod
    async def send_email(
        to: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send an email using Resend API
        
        Args:
            to: Recipient email address
            subject: Email subject
            html_content: HTML email content
            text_content: Plain text fallback (optional)
            
        Returns:
            Dict with status and email_id or error message
        """
        # Check if API key is configured
        if not RESEND_API_KEY or RESEND_API_KEY == "your_resend_api_key_here":
            logger.warning(f"📧 [SIMULATED] Email to {to}: {subject}")
            return {
                "status": "simulated",
                "message": "Email sending simulated (API key not configured)",
                "to": to,
                "subject": subject
            }
        
        params = {
            "from": SENDER_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html_content
        }
        
        if text_content:
            params["text"] = text_content
        
        try:
            # Run sync SDK in thread to keep FastAPI non-blocking
            email = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"✅ Email sent to {to}: {subject}")
            return {
                "status": "success",
                "message": f"Email sent to {to}",
                "email_id": email.get("id") if isinstance(email, dict) else None
            }
        except Exception as e:
            logger.error(f"❌ Failed to send email to {to}: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to send email: {str(e)}",
                "to": to
            }
    
    @staticmethod
    async def send_contact_form_notification(
        name: str,
        email: str,
        phone: Optional[str],
        message: str,
        inquiry_type: str = "general"
    ) -> Dict[str, Any]:
        """Send notification to admin when contact form is submitted"""
        
        subject = f"New {inquiry_type.title()} Inquiry from {name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #EA580C 0%, #C2410C 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }}
                .field {{ margin-bottom: 20px; }}
                .label {{ font-weight: bold; color: #EA580C; margin-bottom: 5px; }}
                .value {{ color: #333; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">New Contact Inquiry</h1>
                    <p style="margin: 10px 0 0 0;">EstateX Real Estate</p>
                </div>
                <div class="content">
                    <div class="field">
                        <div class="label">Inquiry Type:</div>
                        <div class="value">{inquiry_type.title()}</div>
                    </div>
                    <div class="field">
                        <div class="label">Name:</div>
                        <div class="value">{name}</div>
                    </div>
                    <div class="field">
                        <div class="label">Email:</div>
                        <div class="value"><a href="mailto:{email}">{email}</a></div>
                    </div>
                    {f'<div class="field"><div class="label">Phone:</div><div class="value">{phone}</div></div>' if phone else ''}
                    <div class="field">
                        <div class="label">Message:</div>
                        <div class="value" style="white-space: pre-wrap;">{message}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>This email was sent from your EstateX contact form.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await EmailService.send_email(
            to=ADMIN_EMAIL,
            subject=subject,
            html_content=html_content
        )
    
    @staticmethod
    async def send_contact_confirmation(
        name: str,
        email: str
    ) -> Dict[str, Any]:
        """Send confirmation email to user after submitting contact form"""
        
        subject = "Thank you for contacting EstateX"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #EA580C 0%, #C2410C 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ background: white; padding: 30px; border: 1px solid #ddd; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #EA580C; color: white; text-decoration: none; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Thank You!</h1>
                    <p style="margin: 10px 0 0 0;">We've received your message</p>
                </div>
                <div class="content">
                    <p>Hi {name},</p>
                    <p>Thank you for reaching out to EstateX. We've received your inquiry and our team will get back to you within 24 hours.</p>
                    <p>In the meantime, feel free to:</p>
                    <ul>
                        <li>Browse our latest property listings</li>
                        <li>Use our mortgage calculator to plan your budget</li>
                        <li>Learn more about our team of expert agents</li>
                    </ul>
                    <p style="margin-top: 30px;">Best regards,<br><strong>The EstateX Team</strong></p>
                </div>
                <div class="footer">
                    <p>EstateX Real Estate | Your trusted property partner</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await EmailService.send_email(
            to=email,
            subject=subject,
            html_content=html_content
        )
    
    @staticmethod
    async def send_property_inquiry_notification(
        name: str,
        email: str,
        phone: Optional[str],
        message: str,
        property_title: str,
        property_id: str,
        property_price: float
    ) -> Dict[str, Any]:
        """Send notification to admin about property-specific inquiry"""
        
        subject = f"Property Inquiry: {property_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #EA580C 0%, #C2410C 100%); color: white; padding: 30px; text-align: center; }}
                .property-box {{ background: #f9f9f9; padding: 20px; margin: 20px 0; border-left: 4px solid #EA580C; }}
                .content {{ background: white; padding: 30px; border: 1px solid #ddd; }}
                .field {{ margin-bottom: 15px; }}
                .label {{ font-weight: bold; color: #EA580C; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Property Inquiry</h1>
                    <p style="margin: 10px 0 0 0;">New lead for your property</p>
                </div>
                <div class="content">
                    <div class="property-box">
                        <h2 style="margin: 0 0 10px 0; color: #EA580C;">{property_title}</h2>
                        <p style="margin: 0;"><strong>Price:</strong> ${property_price:,.2f}</p>
                        <p style="margin: 5px 0 0 0;"><strong>Property ID:</strong> {property_id}</p>
                    </div>
                    
                    <h3 style="color: #EA580C;">Customer Details:</h3>
                    <div class="field">
                        <span class="label">Name:</span> {name}
                    </div>
                    <div class="field">
                        <span class="label">Email:</span> <a href="mailto:{email}">{email}</a>
                    </div>
                    {f'<div class="field"><span class="label">Phone:</span> {phone}</div>' if phone else ''}
                    <div class="field">
                        <span class="label">Message:</span>
                        <p style="white-space: pre-wrap; margin: 5px 0 0 0;">{message}</p>
                    </div>
                </div>
                <div class="footer">
                    <p>This is a high-priority lead. Please respond within 24 hours.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await EmailService.send_email(
            to=ADMIN_EMAIL,
            subject=subject,
            html_content=html_content
        )
    
    @staticmethod
    async def send_valuation_request_notification(
        name: str,
        email: str,
        phone: Optional[str],
        address: str,
        property_type: str,
        bedrooms: str,
        message: str
    ) -> Dict[str, Any]:
        """Send notification to admin about valuation request"""
        
        subject = f"Property Valuation Request from {name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ background: white; padding: 30px; border: 1px solid #ddd; }}
                .property-details {{ background: #f0fdf4; padding: 20px; margin: 20px 0; border-radius: 8px; }}
                .field {{ margin-bottom: 15px; }}
                .label {{ font-weight: bold; color: #10B981; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Property Valuation Request</h1>
                    <p style="margin: 10px 0 0 0;">New valuation inquiry</p>
                </div>
                <div class="content">
                    <div class="property-details">
                        <h3 style="margin: 0 0 15px 0; color: #10B981;">Property Information</h3>
                        <div class="field">
                            <span class="label">Address:</span> {address}
                        </div>
                        <div class="field">
                            <span class="label">Property Type:</span> {property_type.title()}
                        </div>
                        <div class="field">
                            <span class="label">Bedrooms:</span> {bedrooms}
                        </div>
                    </div>
                    
                    <h3 style="color: #10B981;">Owner Details:</h3>
                    <div class="field">
                        <span class="label">Name:</span> {name}
                    </div>
                    <div class="field">
                        <span class="label">Email:</span> <a href="mailto:{email}">{email}</a>
                    </div>
                    {f'<div class="field"><span class="label">Phone:</span> {phone}</div>' if phone else ''}
                    
                    {f'<div class="field"><span class="label">Additional Information:</span><p style="white-space: pre-wrap; margin: 5px 0 0 0;">{message}</p></div>' if message else ''}
                </div>
                <div class="footer">
                    <p>Please contact the client within 24 hours to schedule a valuation.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await EmailService.send_email(
            to=ADMIN_EMAIL,
            subject=subject,
            html_content=html_content
        )
    
    @staticmethod
    async def send_welcome_email(
        name: str,
        email: str
    ) -> Dict[str, Any]:
        """Send welcome email to new user after first login"""
        
        subject = "Welcome to EstateX - Your Property Journey Starts Here"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #EA580C 0%, #C2410C 100%); color: white; padding: 40px; text-align: center; }}
                .content {{ background: white; padding: 30px; border: 1px solid #ddd; }}
                .feature {{ padding: 15px; margin: 10px 0; background: #f9f9f9; border-left: 3px solid #EA580C; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #EA580C; color: white; text-decoration: none; border-radius: 4px; margin: 10px 5px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 32px;">Welcome to EstateX!</h1>
                    <p style="margin: 15px 0 0 0; font-size: 18px;">Your trusted real estate partner</p>
                </div>
                <div class="content">
                    <p style="font-size: 18px;">Hi {name},</p>
                    <p>Welcome to EstateX! We're thrilled to have you join our community of property seekers and investors.</p>
                    
                    <h3 style="color: #EA580C; margin-top: 30px;">What you can do with EstateX:</h3>
                    
                    <div class="feature">
                        <strong>🏠 Browse Properties</strong><br>
                        Explore our curated collection of premium properties
                    </div>
                    
                    <div class="feature">
                        <strong>🔍 Advanced Search</strong><br>
                        Filter by price, location, bedrooms, and property type
                    </div>
                    
                    <div class="feature">
                        <strong>💰 Financial Calculators</strong><br>
                        Use our mortgage and affordability calculators
                    </div>
                    
                    <div class="feature">
                        <strong>👥 Expert Agents</strong><br>
                        Connect with our experienced real estate professionals
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="#" class="button">Browse Properties</a>
                        <a href="#" class="button" style="background: white; color: #EA580C; border: 2px solid #EA580C;">Contact Us</a>
                    </div>
                    
                    <p style="margin-top: 30px;">If you have any questions, our team is here to help!</p>
                    
                    <p style="margin-top: 30px;">Best regards,<br><strong>The EstateX Team</strong></p>
                </div>
                <div class="footer">
                    <p>EstateX Real Estate | Making property dreams come true</p>
                    <p style="margin-top: 10px; font-size: 10px;">
                        You received this email because you signed up for EstateX.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await EmailService.send_email(
            to=email,
            subject=subject,
            html_content=html_content
        )


# Convenience functions
async def send_contact_notification(name: str, email: str, phone: Optional[str], message: str, inquiry_type: str = "general"):
    """Send contact form notification to admin"""
    return await EmailService.send_contact_form_notification(name, email, phone, message, inquiry_type)

async def send_contact_confirmation(name: str, email: str):
    """Send confirmation to user"""
    return await EmailService.send_contact_confirmation(name, email)

async def send_property_inquiry(name: str, email: str, phone: Optional[str], message: str, 
                               property_title: str, property_id: str, property_price: float):
    """Send property inquiry notification"""
    return await EmailService.send_property_inquiry_notification(
        name, email, phone, message, property_title, property_id, property_price
    )

async def send_valuation_request(name: str, email: str, phone: Optional[str], address: str,
                                property_type: str, bedrooms: str, message: str):
    """Send valuation request notification"""
    return await EmailService.send_valuation_request_notification(
        name, email, phone, address, property_type, bedrooms, message
    )

async def send_welcome_email(name: str, email: str):
    """Send welcome email to new user"""
    return await EmailService.send_welcome_email(name, email)
