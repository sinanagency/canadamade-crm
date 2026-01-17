# Email Authentication Setup Guide
## CanadaMade - SendGrid Domain Verification

**Project:** CanadaMade Gulf Expo 2026
**Domain:** canadamade.com
**Email Service:** SendGrid
**Priority:** High - Emails currently flagged as suspicious

---

## Problem

Emails sent from `info@canadamade.com` are being flagged as suspicious by Gmail and other email providers because the domain lacks proper authentication (SPF, DKIM, DMARC).

![Email marked suspicious](https://i.imgur.com/example.png)

---

## Solution Overview

We need to:
1. Authenticate the domain in SendGrid
2. Add DNS records (CNAME, TXT) to the domain
3. Verify the setup

**Estimated Time:** 15-30 minutes
**DNS Propagation:** Up to 48 hours (usually faster)

---

## Step 1: SendGrid Domain Authentication

### 1.1 Access SendGrid Dashboard

1. Log in to SendGrid: https://app.sendgrid.com
2. Navigate to: **Settings** → **Sender Authentication**
3. Click **"Authenticate Your Domain"**

### 1.2 Configure Domain

1. **DNS Host:** Select your DNS provider (Cloudflare, GoDaddy, etc.)
   - If not listed, select "Other"

2. **Domain:** Enter `canadamade.com`

3. **Advanced Settings:**
   - ✅ Check "Use automated security"
   - ✅ Check "Use custom return path" (optional but recommended)
   - Custom return path: `em` (this creates em.canadamade.com)

4. Click **Next**

### 1.3 Copy DNS Records

SendGrid will generate 3 CNAME records. They will look similar to:

| Type | Host/Name | Value/Points To |
|------|-----------|-----------------|
| CNAME | `em1234.canadamade.com` | `u12345678.wl.sendgrid.net` |
| CNAME | `s1._domainkey.canadamade.com` | `s1.domainkey.u12345678.wl.sendgrid.net` |
| CNAME | `s2._domainkey.canadamade.com` | `s2.domainkey.u12345678.wl.sendgrid.net` |

⚠️ **IMPORTANT:** Copy the EXACT values from SendGrid. The numbers above are examples.

---

## Step 2: Add DNS Records

### For Cloudflare:

1. Log in to Cloudflare Dashboard
2. Select `canadamade.com`
3. Go to **DNS** → **Records**
4. Add each CNAME record:
   - Click **Add record**
   - Type: `CNAME`
   - Name: (paste the host from SendGrid, without the domain)
   - Target: (paste the value from SendGrid)
   - Proxy status: **DNS only** (grey cloud) ⚠️ Important!
   - Click **Save**

### For GoDaddy:

1. Log in to GoDaddy
2. Go to **My Products** → **DNS**
3. Select `canadamade.com`
4. Click **Add** under Records
5. For each record:
   - Type: `CNAME`
   - Host: (paste host without domain, e.g., `em1234`)
   - Points to: (paste SendGrid value)
   - TTL: 1 Hour
   - Click **Save**

### For Namecheap:

1. Log in to Namecheap
2. Go to **Domain List** → **Manage** → **Advanced DNS**
3. Add each CNAME record under "Host Records"

### For Other Providers:

Follow similar steps - add CNAME records with the exact values from SendGrid.

---

## Step 3: Add SPF Record

Add/update the SPF record to authorize SendGrid:

| Type | Host/Name | Value |
|------|-----------|-------|
| TXT | `@` | `v=spf1 include:sendgrid.net ~all` |

**If an SPF record already exists**, modify it to include SendGrid:

```
# Before:
v=spf1 include:_spf.google.com ~all

# After:
v=spf1 include:_spf.google.com include:sendgrid.net ~all
```

---

## Step 4: Add DMARC Record (Recommended)

Add a DMARC record for additional security:

| Type | Host/Name | Value |
|------|-----------|-------|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@canadamade.com` |

This starts in monitoring mode (`p=none`). After verifying everything works, you can strengthen to `p=quarantine` or `p=reject`.

---

## Step 5: Verify in SendGrid

1. Return to SendGrid Sender Authentication
2. Click **Verify** next to your domain
3. Wait for green checkmarks on all records

If verification fails:
- DNS propagation may still be in progress (wait 15-60 minutes)
- Double-check record values for typos
- Ensure Cloudflare proxy is OFF for CNAME records

---

## Step 6: Verify Single Sender (Backup)

While domain authentication propagates, also verify the sender email:

1. In SendGrid, go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in:
   - From Email: `info@canadamade.com`
   - From Name: `CanadaMade`
   - Reply To: `info@canadamade.com`
   - Company: `CanadaMade Foods Inc.`
   - Address: `Toronto, Ontario, Canada`
4. Click **Create**
5. Check inbox for verification email and click the link

---

## Verification Checklist

After setup, verify everything is working:

### DNS Check
Use https://mxtoolbox.com to verify records:

- [ ] SPF Record: https://mxtoolbox.com/spf.aspx (enter canadamade.com)
- [ ] DKIM Record: https://mxtoolbox.com/dkim.aspx
- [ ] DMARC Record: https://mxtoolbox.com/dmarc.aspx

### SendGrid Check
- [ ] Domain shows "Verified" in Sender Authentication
- [ ] All 3 CNAME records show green checkmarks

### Email Test
- [ ] Send test email to Gmail account
- [ ] Email should NOT show "suspicious" warning
- [ ] Check email headers for `spf=pass` and `dkim=pass`

---

## DNS Records Summary

Here's a complete list of all DNS records needed:

```
# SendGrid CNAME Records (get exact values from SendGrid dashboard)
CNAME  em1234           →  u12345678.wl.sendgrid.net
CNAME  s1._domainkey    →  s1.domainkey.u12345678.wl.sendgrid.net
CNAME  s2._domainkey    →  s2.domainkey.u12345678.wl.sendgrid.net

# SPF Record
TXT    @                →  v=spf1 include:sendgrid.net ~all

# DMARC Record
TXT    _dmarc           →  v=DMARC1; p=none; rua=mailto:dmarc@canadamade.com
```

---

## Troubleshooting

### "Emails still going to spam"

1. Wait for full DNS propagation (up to 48 hours)
2. Check SendGrid's Email Activity for delivery status
3. Verify SPF and DKIM are passing in email headers

### "CNAME record not found"

1. Ensure you're adding just the subdomain, not full domain
   - ✅ Correct: `em1234`
   - ❌ Wrong: `em1234.canadamade.com`
2. If using Cloudflare, ensure proxy is OFF (grey cloud)

### "SPF record conflict"

Only one SPF record allowed per domain. Merge all includes:
```
v=spf1 include:_spf.google.com include:sendgrid.net include:other.com ~all
```

---

## Credentials & Access Needed

To complete this setup, you'll need:

1. **SendGrid Account Access**
   - URL: https://app.sendgrid.com
   - Need admin access to Sender Authentication

2. **DNS Provider Access**
   - Cloudflare / GoDaddy / Namecheap (wherever canadamade.com is hosted)
   - Need ability to add CNAME and TXT records

---

## Support Contacts

- **SendGrid Support:** https://support.sendgrid.com
- **DNS Issues:** Contact your domain registrar

---

## After Completion

Once verified, notify the team:
- Email authentication is complete
- Test emails should no longer be flagged
- Monitor SendGrid dashboard for delivery rates

---

*Document Created: January 2026*
*Project: CanadaMade Gulf Expo Dubai 2026*
