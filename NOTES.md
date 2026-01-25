# Gulf Expo 2026 - Morning Checklist

**Last Updated:** January 26, 2026 (night before expo)

---

## What Was Fixed Tonight

### 1. Double Verification Code Issue
- Added `isVerifying` flag to prevent double-clicks on verify button
- Modal now hides AFTER successful Supabase save (not before)
- Error recovery restores UI state if submission fails

### 2. WhatsApp Delivery Issues (US/Canada Numbers)
- **Root Cause:** WhatsApp Business API 24-hour conversation window
- Users must message the business first before receiving messages (unless using template messages)
- **Solution:** Smart fallback shows code on screen
  - WhatsApp: 5 sec link appears, 12 sec auto-reveal
  - Email/SMS: 10 sec link, 20 sec auto-reveal
- Message: "WhatsApp delivery can vary. Your code is: XXXX"

### 3. Data Backup
- All leads saved to Supabase (primary)
- Backup email sent to info@canadamade.com with full lead data
- Email includes formatted HTML + raw JSON backup

---

## Morning Verification Checklist

- [ ] Open https://gulfexpo.canadamade.com/
- [ ] Open https://gulfexpo.canadamade.com/staff/ in another tab
- [ ] Submit a test lead with YOUR phone number
- [ ] Verify:
  - [ ] Verification code received (WhatsApp/Email/SMS)
  - [ ] If not received, code shows on screen after 5-12 seconds
  - [ ] After verification, success screen appears
  - [ ] Lead appears in staff portal immediately
  - [ ] Backup email received at info@canadamade.com

---

## Staff Portal Access

**URL:** https://gulfexpo.canadamade.com/staff/

**Features:**
- Real-time lead list with search
- Click lead to view details
- Mark as "Collected" when sample given
- Export to CSV
- Filter by verified/collected status

---

## Known Limitations

1. **WhatsApp 24-hour window:** First-time contacts may not receive WhatsApp messages. Fallback code display handles this.

2. **WhatsApp sender name:** Shows as "zime" not "Canada Made" - requires Meta Business approval to change.

3. **SMS:** Twilio credentials needed for SMS to work. Currently falls back to showing code.

---

## Emergency Contacts

- **Technical Issues:** Check Netlify dashboard for function logs
- **Supabase Dashboard:** https://supabase.com/dashboard/project/iaabsenvpwyqakvkypeq

---

## Quick Commands

```bash
# View recent leads
curl "https://iaabsenvpwyqakvkypeq.supabase.co/rest/v1/leads?select=*&order=created_at.desc&limit=5" \
  -H "apikey: YOUR_KEY" -H "Authorization: Bearer YOUR_KEY"

# Check Netlify function logs
netlify logs:function send-whatsapp
```

---

**Good luck at the expo!**
