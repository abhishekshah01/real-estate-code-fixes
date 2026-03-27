# Email System Documentation - EstateX Real Estate

## Overview
Complete email notification system for the EstateX real estate website using Resend API.

---

## 📧 Email Types Implemented

### 1. **Contact Form Notifications**
- **Trigger:** When user submits contact form
- **Recipients:** 
  - Admin receives inquiry details
  - User receives confirmation email
- **Template:** Professional HTML with inquiry details

### 2. **Property Inquiry Notifications**
- **Trigger:** When user inquires about a specific property
- **Recipients:** Admin receives detailed inquiry with property info
- **Template:** Includes property title, price, ID, and customer details

### 3. **Valuation Request Notifications**
- **Trigger:** When user requests property valuation
- **Recipients:** Admin receives valuation request details
- **Template:** Green-themed with property details (address, type, bedrooms)

### 4. **Welcome Email**
- **Trigger:** When new user signs up/logs in for the first time
- **Recipients:** New user
- **Template:** Branded welcome message with platform features

### 5. **User Confirmation Email**
- **Trigger:** After submitting contact/inquiry form
- **Recipients:** User who submitted the form
- **Template:** Thank you message with next steps

---

## 🔧 Configuration Required

### 1. Get Resend API Key
1. Sign up at https://resend.com
2. Go to Dashboard → API Keys
3. Create a new API Key (starts with `re_...`)
4. Copy the API key

### 2. Update Environment Variables

Edit `/app/backend/.env`:

```env
# Email Configuration
RESEND_API_KEY=re_your_actual_api_key_here
SENDER_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

### 3. Configure Email Addresses
- **SENDER_EMAIL:** The "From" address for all emails (must be verified in Resend)
- **ADMIN_EMAIL:** Where admin notifications will be sent

### 4. Restart Backend
```bash
sudo supervisorctl restart backend
```

---

## 📝 Testing Emails

### Test Endpoint: `/api/test-email`

Test different email types before going live:

**1. Test Contact Form Notification:**
```bash
curl -X POST "YOUR_BACKEND_URL/api/test-email?email_type=contact&recipient_email=admin@yourdomain.com"
```

**2. Test Confirmation Email:**
```bash
curl -X POST "YOUR_BACKEND_URL/api/test-email?email_type=confirmation&recipient_email=user@example.com"
```

**3. Test Property Inquiry:**
```bash
curl -X POST "YOUR_BACKEND_URL/api/test-email?email_type=property&recipient_email=admin@yourdomain.com"
```

**4. Test Valuation Request:**
```bash
curl -X POST "YOUR_BACKEND_URL/api/test-email?email_type=valuation&recipient_email=admin@yourdomain.com"
```

**5. Test Welcome Email:**
```bash
curl -X POST "YOUR_BACKEND_URL/api/test-email?email_type=welcome&recipient_email=newuser@example.com"
```

---

## 🚀 How It Works

### Automatic Email Triggers

1. **Contact Form Submission** (`/api/inquiries`)
   - Creates inquiry in database
   - Sends notification to admin
   - Sends confirmation to user
   - Works for general, property, and valuation inquiries

2. **New User Registration** (`/api/auth/session`)
   - Creates user account
   - Sends welcome email to new user
   - Only sends on first login

### Email Flow Diagram

```
User Action
    ↓
Backend Endpoint
    ↓
Create Database Record
    ↓
Trigger Email Service (async, non-blocking)
    ↓
Send Emails (admin + user)
    ↓
Return Success Response
```

---

## 📂 File Structure

```
/app/backend/
├── email_service.py          # Main email service with all templates
├── server.py                  # Updated with email integration
├── .env                       # Email configuration
└── requirements.txt           # Added resend>=2.0.0
```

---

## 🎨 Email Templates

All emails include:
- ✅ Professional HTML design
- ✅ Responsive layout
- ✅ Branded colors (Orange #EA580C)
- ✅ Inline CSS for email client compatibility
- ✅ Plain text fallback
- ✅ Proper formatting and structure

### Template Features:
- **Header:** Gradient background with company branding
- **Content:** Clean, readable with proper spacing
- **Footer:** Company info and legal text
- **Colors:** Match your website theme
- **Mobile-friendly:** Works on all devices

---

## 🔍 Email Service Functions

### Main Functions in `email_service.py`:

```python
# Generic send email
EmailService.send_email(to, subject, html_content, text_content)

# Specific email types
EmailService.send_contact_form_notification(name, email, phone, message, inquiry_type)
EmailService.send_contact_confirmation(name, email)
EmailService.send_property_inquiry_notification(name, email, phone, message, property_title, property_id, property_price)
EmailService.send_valuation_request_notification(name, email, phone, address, property_type, bedrooms, message)
EmailService.send_welcome_email(name, email)
```

---

## ⚙️ Technical Details

### Non-Blocking Email Sending
- Uses `asyncio.to_thread()` to run synchronous Resend SDK
- Keeps FastAPI event loop non-blocking
- Email sending doesn't slow down API responses

### Error Handling
- Emails are sent asynchronously
- Failures are logged but don't break the main flow
- Users get their confirmation even if admin email fails
- Inquiry is saved to database before sending emails

### Simulation Mode
When API key is not configured:
- Emails are logged to console
- Returns "simulated" status
- Useful for development/testing
- No actual emails are sent

---

## 📊 Monitoring & Logs

### Check Email Logs:
```bash
tail -f /var/log/supervisor/backend.*.log | grep -i email
```

### Success Indicators:
- `✅ Email sent to {email}: {subject}`
- `✅ Resend API initialized`

### Error Indicators:
- `❌ Failed to send email to {email}: {error}`
- `⚠️ RESEND_API_KEY not configured`

---

## 🔒 Security Best Practices

1. **Never commit API keys to git**
2. **Use environment variables only**
3. **Verify sender domain in Resend**
4. **Validate user input before sending emails**
5. **Rate limit email endpoints if needed**
6. **Use HTTPS for all API calls**

---

## 🎯 Next Steps After Configuration

1. **Get Resend API Key** from https://resend.com
2. **Verify your domain** in Resend dashboard
3. **Update .env file** with your credentials
4. **Restart backend** server
5. **Test all email types** using test endpoint
6. **Submit a real inquiry** from your website
7. **Check admin email** inbox
8. **Verify user confirmation** email delivery

---

## 💡 Customization Tips

### Change Email Design:
Edit templates in `email_service.py` → Modify HTML in each function

### Add New Email Type:
1. Create new function in `EmailService` class
2. Add HTML template
3. Call from appropriate endpoint in `server.py`

### Change Colors:
Search and replace `#EA580C` with your brand color in `email_service.py`

### Add Logo:
1. Host logo image online (CDN)
2. Add `<img src="URL">` to email header
3. Use inline styles for sizing

---

## 🐛 Troubleshooting

### "Email sending simulated"
- **Cause:** API key not configured
- **Fix:** Add RESEND_API_KEY to .env and restart

### "Failed to send email"
- **Cause:** Invalid API key or domain not verified
- **Fix:** Check Resend dashboard, verify domain

### "Email not received"
- **Cause:** Email in spam or Resend testing mode
- **Fix:** Check spam folder, verify domain in Resend

### Backend won't start after changes
- **Cause:** Syntax error or import issue
- **Fix:** Check logs with `tail -f /var/log/supervisor/backend.*.log`

---

## 📧 Support

For issues with:
- **Resend API:** Check https://resend.com/docs
- **Email deliverability:** Verify domain DNS settings
- **Template customization:** Edit `email_service.py`

---

## ✅ Checklist

Before going live, ensure:
- [ ] Resend API key configured
- [ ] Domain verified in Resend
- [ ] SENDER_EMAIL set to verified address
- [ ] ADMIN_EMAIL set to your inbox
- [ ] Backend restarted after configuration
- [ ] All email types tested
- [ ] Real inquiry tested from website
- [ ] Emails received in correct inboxes
- [ ] Email design looks good on mobile
- [ ] Spam filters not blocking emails

---

**Email System Status:** ✅ Fully Implemented & Ready for Configuration
**Next Action:** Add Resend API key to activate email sending
