# Google Sheets & Gmail Form Backend Setup Guide

This backend connects the **LeeOnTrack** driver application form ([application.html](file:///c:/Users/liamo/OneDrive/Desktop/PROJECTS/leeontrack-versions/leeontrack/LeeOnTrack/application.html)) directly to a private **Google Sheet** and sends instant notification emails via **Gmail** (`leeontrack5@gmail.com`).

---

## Why this is better than FormSubmit.co
- **100% Reliability:** Runs on Google's cloud infrastructure (no missed or dropped submissions).
- **Driver Database:** Every application is safely recorded in a Google Sheet with timestamp, stats, and answers.
- **Instant Admin Alerts:** Sends a formatted HTML alert email directly to `leeontrack5@gmail.com` with a 1-click reply button.
- **Applicant Receipt:** Automatically emails the driver confirming their application was received, with a link to the LeeOnTrack Discord server.
- **Zero Cost & Free Forever:** Uses standard Google Apps Script included with every Google account.

---

## Step-by-Step Setup (Takes 3 Minutes)

### 1. Create a New Google Sheet
1. Open your browser while logged into `leeontrack5@gmail.com`.
2. Go to **[sheets.new](https://sheets.new)** to create a new spreadsheet.
3. Rename the spreadsheet in the top left to:  
   `LeeOnTrack Driver Applications`

---

### 2. Open Apps Script
1. In the top menu of your Google Sheet, click **Extensions** &rarr; **Apps Script**.
2. A new tab will open with a code editor showing a file named `Code.gs`.
3. Select all code in `Code.gs` and delete it.
4. Open [Code.js](file:///c:/Users/liamo/OneDrive/Desktop/PROJECTS/leeontrack-versions/leeontrack/LeeOnTrack/backend/google-apps-script/Code.js) in this project, copy the entire content, and paste it into the editor.
5. Click the **Save** icon (diskette icon) or press `Ctrl + S`.

---

### 3. Test the Script & Authorize Permissions (Optional but Recommended)
1. In the Apps Script toolbar, locate the function dropdown (next to "Debug" and "Run").
2. Select **`testSubmission`** from the dropdown list.
3. Click **Run**.
4. A popup will appear saying *"Authorization required"*. Click **Review permissions**.
5. Select your `leeontrack5@gmail.com` account.
6. If Google shows *"Google hasn't verified this app"*, click **Advanced** (bottom left), then click **Go to Untitled project (unsafe)**.
7. Click **Allow**.
8. Check your Google Sheet tab "Applications" and your Gmail inbox — you should see a test submission from "Lewis Hamilton"!

---

### 4. Deploy as a Web App
1. At the top right of the Apps Script page, click the blue **Deploy** button &rarr; **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the deployment settings:
   - **Description**: `LeeOnTrack Backend v1`
   - **Execute as**: `Me (leeontrack5@gmail.com)`
   - **Who has access**: **`Anyone`**  
     *(⚠️ Critical: This must be set to "Anyone" so that drivers visiting the website can submit the form without needing to sign into Google).*
4. Click **Deploy**.
5. Copy the generated **Web app URL** (it looks like `https://script.google.com/macros/s/AKfycbx.../exec`).

---

### 5. Plug the URL into the Website
1. Open [application.html](file:///c:/Users/liamo/OneDrive/Desktop/PROJECTS/leeontrack-versions/leeontrack/LeeOnTrack/application.html).
2. Find the form element and set `action` to your copied Web App URL:
   ```html
   <form class="application__form" action="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec" method="POST">
   ```
3. Commit and push to GitHub. You're all set!
