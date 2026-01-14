# Visitor Tracking Setup Guide

This guide will help you set up email notifications and data storage for your portfolio visitor tracking system.

## Overview

The tracking system will:
1. **Send email notifications** to `sarakhaled.kaz@gmail.com` whenever someone visits your site
2. **Store all visitor data** in a Google Sheet for historical reporting and analysis

---

## Part 1: EmailJS Setup (Email Notifications)

### Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (200 emails/month free)
3. Verify your email address

### Step 2: Create Email Service
1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose **Gmail** (or your preferred email provider)
4. Follow the connection steps to connect your Gmail account
5. **Copy the Service ID** (you'll need this later)

### Step 3: Create Email Template
1. Go to **Email Templates** in the dashboard
2. Click **Create New Template**
3. Use this template:

**Template Name:** Portfolio Visitor Notification

**Subject:** `New Visitor to Your Portfolio - {{visitor_location}}`

**Content:**
```
A new visitor has viewed your portfolio!

Location: {{visitor_location}}
IP Address: {{visitor_ip}}
Time: {{visitor_time}}
Referrer: {{visitor_referrer}}
Device: {{visitor_device}}
Screen: {{visitor_screen}}
Timezone: {{visitor_timezone}}
Language: {{visitor_language}}

Visit URL: {{visitor_url}}
```

4. **Copy the Template ID** (you'll need this later)

### Step 4: Get Public Key
1. Go to **Account** → **General**
2. Find your **Public Key** and copy it

### Step 5: Update Configuration in index.html
Open `index.html` and find the `EMAILJS_CONFIG` section (around line 3612). Update these values:

```javascript
const EMAILJS_CONFIG = {
  SERVICE_ID: 'your_service_id_here',        // From Step 2
  TEMPLATE_ID: 'your_template_id_here',      // From Step 3
  PUBLIC_KEY: 'your_public_key_here',        // From Step 4
  TO_EMAIL: 'sarakhaled.kaz@gmail.com'       // Already set correctly
};
```

---

## Part 2: Google Sheets Setup (Data Storage & Reporting)

### Step 1: Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Portfolio Visitors" (or any name you prefer)
4. In the first row, add these column headers:
   - `Timestamp`
   - `IP Address`
   - `City`
   - `Region`
   - `Country`
   - `Country Code`
   - `Timezone`
   - `ISP`
   - `Referrer`
   - `User Agent`
   - `Screen Resolution`
   - `Viewport Size`
   - `Language`
   - `URL`

### Step 2: Create Google Apps Script
1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any existing code
3. Paste this code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Prepare row data
    const rowData = [
      data.timestamp || new Date().toISOString(),
      data.ip_address || 'Unknown',
      data.city || 'Unknown',
      data.region || 'Unknown',
      data.country || 'Unknown',
      data.country_code || 'Unknown',
      data.timezone || 'Unknown',
      data.isp || 'Unknown',
      data.referrer || 'Direct',
      data.user_agent || 'Unknown',
      data.screen_resolution || 'Unknown',
      data.viewport_size || 'Unknown',
      data.language || 'Unknown',
      data.url || 'Unknown'
    ];
    
    // Add row to sheet
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Portfolio Visitor Tracker is running!")
    .setMimeType(ContentService.MimeType.TEXT);
}
```

4. Click **Save** (💾 icon) and name your project "Portfolio Visitor Tracker"

### Step 3: Deploy as Web App
1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
3. Set these settings:
   - **Description:** Portfolio Visitor Tracker
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**
5. **Authorize access:**
   - Click "Authorize access"
   - Choose your Google account
   - Click "Advanced" → "Go to Portfolio Visitor Tracker (unsafe)"
   - Click "Allow"
6. **Copy the Web App URL** - this is your `GOOGLE_SHEETS_WEB_APP_URL`

### Step 4: Update Configuration in index.html
Open `index.html` and find the `GOOGLE_SHEETS_WEB_APP_URL` (around line 3620). Update it:

```javascript
const GOOGLE_SHEETS_WEB_APP_URL = 'your_web_app_url_here'; // From Step 3
```

---

## Part 3: Testing

### Test Email Notifications
1. Open your portfolio site in a browser
2. Check your email (`sarakhaled.kaz@gmail.com`) - you should receive a notification
3. Check the browser console (F12) for any errors

### Test Google Sheets Storage
1. Visit your portfolio site
2. Open your Google Sheet
3. You should see a new row with visitor data
4. If no data appears, check the browser console for errors

---

## Part 4: Viewing Reports

### Access Historical Visitor Data
1. Open your Google Sheet "Portfolio Visitors"
2. You'll see all visitors listed with their details
3. You can:
   - Sort by any column
   - Filter data
   - Create charts and pivot tables
   - Export to CSV/Excel

### Email Notifications
- Check your email inbox (`sarakhaled.kaz@gmail.com`)
- Each visitor triggers one email notification
- Search your inbox for "New Visitor to Your Portfolio" to see all notifications

---

## Troubleshooting

### Emails Not Sending
- Verify EmailJS configuration values are correct
- Check EmailJS dashboard for usage limits (free tier: 200/month)
- Check browser console for errors
- Verify your email service is connected in EmailJS

### Gmail API Error 412: "Insufficient Authentication Scopes"
If you see this error: `412Gmail_API: Request had insufficient authentication scopes`

**This means your Gmail service in EmailJS needs to be re-authorized.**

**Solution:**
1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Navigate to **Email Services**
3. Find your Gmail service (e.g., `service_38rphlo`)
4. Click **Disconnect** or **Remove** the service
5. Click **Add New Service** → Select **Gmail**
6. Follow the authorization flow:
   - Sign in with your Gmail account
   - **IMPORTANT:** Make sure to grant ALL requested permissions
   - Don't skip any permission requests
7. Copy the new Service ID and update it in `index.html` if it changed

**Alternative Solution:**
If Gmail continues to have issues, switch to a different email service:
1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose a different provider:
   - **SendGrid** (recommended, free tier available)
   - **Mailgun** (free tier available)
   - **SMTP** (works with any email provider)
4. Follow the setup instructions for your chosen provider
5. Update the `SERVICE_ID` in `index.html`

### Data Not Storing in Google Sheets
- Verify the Web App URL is correct
- Check that the Web App is deployed and set to "Anyone" access
- Verify the Apps Script code is saved and deployed
- Check browser console for errors
- Make sure the sheet has the correct column headers

### Both Not Working
- Check browser console (F12) for JavaScript errors
- Verify all configuration values are set (not "YOUR_...")
- Make sure you've saved and committed changes to your repository
- Clear browser cache and reload

---

## Security Notes

- The Google Apps Script Web App URL is public - anyone with the URL can add data
- Consider adding basic authentication or rate limiting if you're concerned about spam
- EmailJS public key is safe to expose in frontend code
- IP addresses and location data are approximate

---

## Need Help?

If you encounter issues:
1. Check the browser console (F12) for error messages
2. Verify all configuration values are correct
3. Test each service independently (EmailJS dashboard, Google Sheets)
4. Make sure you've saved and deployed all changes

---

## Quick Reference

**EmailJS Dashboard:** https://dashboard.emailjs.com/
**Google Sheets:** https://sheets.google.com
**Google Apps Script:** https://script.google.com/

**Configuration Location in index.html:**
- Line ~3612: `EMAILJS_CONFIG`
- Line ~3620: `GOOGLE_SHEETS_WEB_APP_URL`
