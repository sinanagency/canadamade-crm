# CanadaMade Gulf Expo - Message Templates

## Brand Assets
- **Logo URL**: `https://gulfexpo.canadamade.com/logo.png`
- **Primary Color**: #E31837 (CanadaMade Red)
- **Secondary Color**: #DAA520 (Gold)
- **Accent Color**: #fff8f0 (Cream)
- **Dark Color**: #1a1a1a

---

## User Flow

```
1. User scans QR → visits gulfexpo.canadamade.com
2. Fills form (name, email, phone, company, country)
3. Chooses ONE flavor from carousel
4. Selects verification method (WhatsApp/Email/SMS)
5. Clicks "Send Verification Code"
6. ──► FIRST MESSAGE: Verification code (simple)
7. User enters 4-digit code on website
8. If correct:
   - Website shows: "Verified! Proceed to collect your free sample"
   - ──► SECOND MESSAGE: Confirmation (same as website)
9. (Future) Staff module gets notified
```

---

## 1. VERIFICATION CODE MESSAGES (First Message - Simple)

### WhatsApp Verification
```
🍁 *CanadaMade*

Hi {{first_name}}!

Your verification code is: *{{code}}*

Enter this code to verify.
Expires in 10 minutes.
```

### SMS Verification
```
CanadaMade: Your code is {{code}}. Expires in 10 min.
```

### Email Verification
- Subject: "Your CanadaMade Verification Code 🍁"
- Simple message with code in styled box
- Logo + Gulf Expo Dubai 2026 branding

---

## 2. CONFIRMATION MESSAGES (After Verification)

### WhatsApp Confirmation
```
✅ *Verified!*

Hi {{first_name}},

You're all set! Please proceed to the CanadaMade booth to collect your FREE *{{flavor}}* sample.

See you there! 🍁

───────────────
CanadaMade | Gulf Expo Dubai 2026
```

### SMS Confirmation
```
CanadaMade: Verified! Proceed to our booth to collect your FREE {{flavor}} sample. See you there!
```

### Email Confirmation
- Subject: "✅ Verified! Collect Your Free Sample"
- Green success banner with checkmark
- Shows flavor in styled box
- Logo + branding

---

## 3. WEBSITE SUCCESS SCREEN

After user enters correct code:

```
┌─────────────────────────────────────┐
│              ✅                     │
│           Verified!                 │
│                                     │
│  Please proceed to the CanadaMade   │
│  booth to collect your FREE sample! │
│                                     │
│    ┌─────────────────────────┐      │
│    │   🍟 Barbeque           │      │
│    └─────────────────────────┘      │
│                                     │
│         🍟🍁✨                      │
│     See you at the booth!           │
└─────────────────────────────────────┘
```

---

## 4. FILES UPDATED

| File | Purpose |
|------|---------|
| `netlify/functions/send-whatsapp.js` | Sends WhatsApp verification code |
| `netlify/functions/send-verification-email.js` | Sends Email verification code |
| `netlify/functions/send-sms.js` | Sends SMS verification code (existing) |
| `netlify/functions/send-confirmation.js` | Sends confirmation after verification (all methods) |
| `index.html` | Updated success overlay + calls confirmation function |

---

## 5. ENVIRONMENT VARIABLES NEEDED

```env
# Email (SendGrid)
SENDGRID_API_KEY=

# SMS (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# WhatsApp (sev7enmarketing.com)
WHATSAPP_API_BASE_URL=
WHATSAPP_API_TOKEN=
WHATSAPP_VENDOR_UID=
WHATSAPP_PHONE_NUMBER_ID=

# Site
SITE_URL=https://gulfexpo.canadamade.com
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

*Last Updated: January 2026*
*Brand: CanadaMade | Gulf Expo Dubai 2026*
