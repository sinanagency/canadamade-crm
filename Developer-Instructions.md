# CanadaMade Gulf Expo - Developer Instructions

**Project:** Lead Capture App with Email, SMS & WhatsApp Notifications
**Date:** January 2026

---

## Overview

I need you to set up email and SMS sending for the Gulf Expo app. You already have access to Supabase and Netlify. WhatsApp integration I will handle myself through Meta Business.

---

## TASK 1: Email Setup (SendGrid)

### What to do:
1. Create a SendGrid account (free tier is fine)
2. Set up domain authentication for `canadamade.com`
3. Send me the DNS records to add (CNAME records for SPF/DKIM)
4. Wait for me to confirm DNS is added
5. Create API key with Mail Send permissions
6. Add API key to Netlify environment variables as `SENDGRID_API_KEY`
7. Create Netlify function `send-email.js` that:
   - Takes recipient email, subject, and body
   - Sends from `info@canadamade.com`
   - Uses template from Supabase `message_templates` table (name: `customer_confirmation_email`)
   - Replaces variables: `{{first_name}}`, `{{flavor}}`

### Provide me:
- [ ] DNS records to add (before you continue)
- [ ] SendGrid login credentials (when complete)
- [ ] Confirmation that `SENDGRID_API_KEY` is in Netlify

---

## TASK 2: SMS Setup (Unifonic)

### What to do:
1. Create a Unifonic account (unifonic.com)
2. Get API credentials (App ID and Sender ID)
3. Add to Netlify environment variables:
   - `UNIFONIC_APP_ID`
   - `UNIFONIC_SENDER_ID` (placeholder until I provide UAE number)
4. Create Netlify function `send-sms.js` that:
   - Takes recipient phone number and message
   - Uses template from Supabase `message_templates` table (name: `customer_confirmation_sms`)
   - Replaces variables: `{{first_name}}`, `{{flavor}}`
5. Test with your own number

### Provide me:
- [ ] Unifonic login credentials
- [ ] Confirmation of Netlify env vars

### I will provide later:
- UAE phone number to register as Sender ID

---

## TASK 3: Connect to App Flow

### Trigger points:
After a customer completes verification in the app:

1. Check `comm_preference` field in the lead data
2. If `email` → call `send-email.js`
3. If `sms` → call `send-sms.js`
4. If `whatsapp` → I will handle this separately

### Update the frontend:
- After successful form submission, call the appropriate notification function
- Log success/failure to console

---

## TASK 4: Staff Notification (Prepare Only)

### Build but don't connect yet:
Create `notify-staff.js` function that:
- Sends a message with customer details:
  - Name, Company, Phone, Email, Country
  - Selected flavor
  - Business card photo URL
- Uses template from `message_templates` (name: `staff_notification`)

I will provide the staff phone number and connection method (SMS or WhatsApp) later.

---

## Database Reference

You already have access. Tables to use:

**`message_templates`** - Pre-loaded with:
- `customer_confirmation_email`
- `customer_confirmation_sms`
- `customer_confirmation_whatsapp`
- `staff_notification`

**`leads`** - Customer data including:
- `first_name`, `last_name`, `company`, `email`, `phone`
- `flavor`, `comm_preference`, `photo_url`

---

## Summary Checklist

### You do:
- [x] Access Supabase and Netlify (already have)
- [ ] SendGrid account + domain verification
- [ ] Unifonic account + API setup
- [ ] Create 3 Netlify functions
- [ ] Connect to app flow
- [ ] Provide me all credentials

### I do:
- [ ] Add DNS records for SendGrid
- [ ] Provide UAE phone number
- [ ] Set up Meta Business / WhatsApp myself
- [ ] Provide staff notification number

---

## Deadline

Please complete Tasks 1-3 by: **[DATE]**

Let me know if you have any questions.
