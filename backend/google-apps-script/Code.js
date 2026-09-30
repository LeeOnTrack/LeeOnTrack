/**
 * ============================================================================
 * LeeOnTrack League Application Backend (Google Apps Script) - HARDENED v3
 * ============================================================================
 * 
 * Handles incoming applications from application.html on https://www.leeontrack.co.uk:
 * 1. Sanitizes all inputs against Spreadsheet Formula Injection (=, +, -, @, |, %).
 * 2. Strips CRLF from single-line fields to prevent email header injection.
 * 3. Sanitizes all HTML against XSS / Email Injection.
 * 4. Honeypot anti-spam protection against automated bots.
 * 5. Per-email rate-limiting (blocks repeat submissions from same address).
 * 6. Global rate-limiting (blocks scripted flooding regardless of email address).
 * 7. Appends driver application details to the "Applications" Google Sheet.
 * 8. Sends a formatted notification email to leeontrack5@gmail.com.
 * 9. Generic error responses — no internal details leaked to callers.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open Google Sheets (https://sheets.new) under your leeontrack5@gmail.com account.
 * 2. Name your spreadsheet: "LeeOnTrack Driver Applications".
 * 3. Click Extensions > Apps Script.
 * 4. Delete any code in Code.gs and paste this entire file.
 * 5. Click Save (floppy disk icon).
 * 6. Select "testSubmission" from the top toolbar dropdown and click "Run" once
 *    to authorize Google permissions (Click "Advanced" > "Go to project (unsafe)").
 * 7. Click Deploy > New deployment.
 * 8. Select type: "Web app".
 * 9. Set:
 *    - Description: "LeeOnTrack Application Backend v3 (Hardened)"
 *    - Execute as: "Me (leeontrack5@gmail.com)"
 *    - Who has access: "Anyone"
 * 10. Click Deploy and copy the Web App URL (starts with https://script.google.com/macros/s/...)
 * 11. Paste that URL into application.html.
 * ============================================================================
 */

// ==========================================
// CONFIGURATION & SECURITY SETTINGS
// ==========================================
const ADMIN_EMAIL = "leeontrack5@gmail.com";
const SHEET_NAME = "Applications";

// Global flood protection: max submissions allowed per hour across all users
// Prevents scripted bots using unique emails to flood the sheet.
const MAX_GLOBAL_SUBMISSIONS_PER_HOUR = 25;

// Rate limit: Number of minutes before the same email address can submit again
const RATE_LIMIT_MINUTES = 5;

// Honeypot field name (hidden from humans, filled by spam bots)
const HONEYPOT_FIELD = "league_ref";

// Email validation pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ==========================================
// REQUEST HANDLERS
// ==========================================

/**
 * Handles HTTP POST requests from the website form.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Wait up to 30 seconds for concurrent write operations
  try {
    lock.waitLock(30000);
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Server is busy. Please try again in a few moments."
    });
  }

  try {
    let data = {};

    // Support both URLSearchParams / Form POST and JSON POST
    if (e && e.postData && e.postData.contents) {
      if (e.postData.type && e.postData.type.indexOf("application/json") !== -1) {
        try {
          data = JSON.parse(e.postData.contents);
        } catch (parseErr) {
          data = e.parameter || {};
        }
      } else {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // 1. HONEYPOT ANTI-SPAM TRAP
    // If the hidden honeypot field has any value, a bot filled it out.
    // Return a fake success response immediately so the bot thinks it succeeded without doing anything.
    const honeypot = (data[HONEYPOT_FIELD] || "").trim();
    if (honeypot !== "") {
      Logger.log("Spam bot detected via honeypot trap. Request silently dropped.");
      return createJsonResponse({
        status: "success",
        message: "Application submitted successfully."
      });
    }

    // 2. GLOBAL RATE LIMIT (prevents scripted flooding with unique emails)
    const cache = CacheService.getScriptCache();
    const globalKey = "lot_global_hourly_count";
    const currentCount = parseInt(cache.get(globalKey) || "0", 10);
    if (currentCount >= MAX_GLOBAL_SUBMISSIONS_PER_HOUR) {
      Logger.log("Global hourly submission limit reached. Request rejected.");
      return createJsonResponse({
        status: "error",
        message: "Application submission is currently experiencing high volume. Please try again later or email leeontrack5@gmail.com directly."
      });
    }

    // 3. INPUT EXTRACTION & LENGTH TRUNCATION (Prevents payload-bloat attacks)
    //    stripCrlf() is applied to all single-line text fields to prevent email header injection.
    const firstName    = truncate(stripCrlf(data["First Name"]              || data["firstName"]    || ""), 60);
    const lastName     = truncate(stripCrlf(data["Last Name"]               || data["lastName"]     || ""), 60);
    const iracingName  = truncate(stripCrlf(data["iRacing Driver Name"]     || data["iracingName"]  || ""), 60);
    const safetyRating = truncate(stripCrlf(data["Safety Rating"]           || data["safetyRating"] || ""), 20);
    const irating      = truncate(stripCrlf((data["iRating"]                || data["irating"]      || "").toString()), 10);
    const customerId   = truncate(stripCrlf((data["iRacing Customer ID"]    || data["customerId"]   || "").toString()), 20);
    const email        = truncate(stripCrlf(data["Email Address"]           || data["email"]        || ""), 100);
    const discord      = truncate(stripCrlf(data["Discord Username"]        || data["discord"]      || ""), 60);
    // experience and lookingFor are multi-line — do not strip newlines, but formula injection is handled by sanitizeForSheet()
    const experience   = truncate((data["iRacing Experience"]               || data["experience"]   || "").trim(), 300);
    const lookingFor   = truncate((data["What They Are Looking For"]        || data["lookingFor"]   || "").trim(), 1500);

    const confirmUnder2000 = data["Confirm Under 2000"] ? "Yes" : "No";
    const readRules = data["Read Rules"] ? "Yes" : "No";
    const agreeRules = data["Agree Rules"] ? "Yes" : "No";
    const friendlyLeague = data["Friendly League"] ? "Yes" : "No";
    const organiserDecisions = data["Organiser Decisions"] ? "Yes" : "No";

    // 3. VALIDATION
    if (!firstName || !lastName || !iracingName || !email) {
      return createJsonResponse({
        status: "error",
        message: "Required fields are missing."
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return createJsonResponse({
        status: "error",
        message: "Invalid email address format."
      });
    }

    // 4. PER-EMAIL RATE-LIMITING (Prevents spam flooding from the same email)
    if (RATE_LIMIT_MINUTES > 0) {
      const emailHash = Utilities.base64Encode(email.toLowerCase()).substring(0, 32);
      const cacheKey = "lot_sub_" + emailHash;
      if (cache.get(cacheKey)) {
        return createJsonResponse({
          status: "error",
          message: "An application from this email was recently received. Please wait a few minutes."
        });
      }
      // Cache this submission for the rate limit duration
      cache.put(cacheKey, "1", RATE_LIMIT_MINUTES * 60);
    }

    // Increment the global hourly counter AFTER per-email check passes.
    // We use a secondary expiry key to avoid resetting the TTL on every write.
    if (currentCount === 0) {
      cache.put(globalKey, "1", 3600);
      cache.put("lot_global_hourly_exp", "1", 3600);
    } else {
      const globalExpKey = "lot_global_hourly_exp";
      if (!cache.get(globalExpKey)) {
        // Window has rolled over — reset counter
        cache.put(globalKey, "1", 3600);
        cache.put(globalExpKey, "1", 3600);
      } else {
        cache.put(globalKey, String(currentCount + 1), 3600);
      }
    }

    // 5. GOOGLE SHEET STORAGE (With Formula Injection Protection)
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    if (!doc) {
      throw new Error("Unable to access Google Spreadsheet. Make sure the script was created via Extensions > Apps Script inside the sheet.");
    }

    let sheet = doc.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = doc.insertSheet(SHEET_NAME);
    }

    const headers = [
      "Timestamp",
      "First Name",
      "Last Name",
      "iRacing Driver Name",
      "Safety Rating",
      "iRating",
      "iRacing Customer ID",
      "Email Address",
      "Discord Username",
      "iRacing Experience",
      "What They Are Looking For",
      "Confirm Under 2000",
      "Read Rules",
      "Agree Rules",
      "Friendly League",
      "Organiser Decisions"
    ];

    // If new or empty sheet, initialize headers with styling
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#121a14");
      headerRange.setFontColor("#28e564");
      headerRange.setFontFamily("Segoe UI");
      headerRange.setFontSize(10);
      sheet.setFrozenRows(1);
    }

    const timestamp = new Date();

    // Sanitize every field against Formula Injection before writing to the Sheet
    sheet.appendRow([
      timestamp,
      sanitizeForSheet(firstName),
      sanitizeForSheet(lastName),
      sanitizeForSheet(iracingName),
      sanitizeForSheet(safetyRating),
      sanitizeForSheet(irating),
      sanitizeForSheet(customerId),
      sanitizeForSheet(email),
      sanitizeForSheet(discord),
      sanitizeForSheet(experience),
      sanitizeForSheet(lookingFor),
      confirmUnder2000,
      readRules,
      agreeRules,
      friendlyLeague,
      organiserDecisions
    ]);

    // 6. ADMIN NOTIFICATION EMAIL (With HTML Escaping)
    sendAdminEmail({
      timestamp: timestamp,
      firstName: firstName,
      lastName: lastName,
      iracingName: iracingName,
      safetyRating: safetyRating,
      irating: irating,
      customerId: customerId,
      email: email,
      discord: discord,
      experience: experience,
      lookingFor: lookingFor
    });

    // NOTE: Automated applicant confirmation emails are intentionally disabled.
    // This prevents the endpoint being used as an open email relay or for
    // quota-exhaustion attacks. League admins can reply directly via the
    // "Reply to Applicant" button in the admin notification email.

    return createJsonResponse({
      status: "success",
      message: "Application submitted successfully."
    });

  } catch (error) {
    // Log full error internally — DO NOT expose stack traces or internal details to callers.
    Logger.log("Error in doPost: " + error.toString());
    return createJsonResponse({
      status: "error",
      message: "Unable to process your application at this time. Please try again later, or email leeontrack5@gmail.com directly."
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handles HTTP GET requests for testing the endpoint in a browser.
 */
function doGet(e) {
  return createJsonResponse({
    status: "online",
    service: "LeeOnTrack Applications API (Hardened)",
    timestamp: new Date().toISOString()
  });
}

// ==========================================
// SECURITY & SANITIZATION HELPERS
// ==========================================

/**
 * Strips carriage returns (\r), newlines (\n), and null bytes (\0) from a string.
 * Apply to all single-line fields to prevent CRLF / email header injection.
 */
function stripCrlf(str) {
  if (!str) return "";
  return String(str).replace(/[\r\n\0]/g, "").trim();
}

/**
 * Prevents Google Sheets Formula Injection (CSV/DDE injection).
 * If a value starts with =, +, -, @, |, %, tab or return, prefix it with a
 * single quote so Google Sheets stores it strictly as plain text.
 * Leading whitespace is trimmed first so "   =cmd" is also caught.
 * Also sanitizes internal newlines followed by a formula trigger character
 * (handles multi-line textarea inputs such as the "lookingFor" field).
 */
function sanitizeForSheet(value) {
  if (value === null || value === undefined) return "";
  const str = String(value).trimStart();
  if (/^[=+@\-\t\r|%]/.test(str)) {
    return "'" + str;
  }
  // Sanitize any embedded line that starts with a formula trigger character
  return str.replace(/(\r\n|\n|\r)([=+@\-\t|%])/g, "$1'$2");
}

/**
 * Escapes HTML characters to prevent XSS / HTML injection in generated emails.
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Truncates strings to a safe maximum length.
 */
function truncate(str, maxLength) {
  if (!str) return "";
  return String(str).substring(0, maxLength);
}

// ==========================================
// EMAIL FUNCTIONS
// ==========================================

/**
 * Sends a sanitized notification email to league organizers.
 */
function sendAdminEmail(applicant) {
  const formattedDate = Utilities.formatDate(applicant.timestamp, "Europe/London", "dd MMM yyyy, HH:mm 'UK'");
  
  // Safe HTML-escaped variables
  const safeFirst = escapeHtml(applicant.firstName);
  const safeLast = escapeHtml(applicant.lastName);
  const safeIracingName = escapeHtml(applicant.iracingName);
  const safeIrating = escapeHtml(applicant.irating);
  const safeSafety = escapeHtml(applicant.safetyRating);
  const safeCustomerId = escapeHtml(applicant.customerId);
  const safeEmail = escapeHtml(applicant.email);
  const safeDiscord = escapeHtml(applicant.discord);
  const safeExperience = escapeHtml(applicant.experience);
  const safeLookingFor = escapeHtml(applicant.lookingFor).replace(/\n/g, '<br>');

  // Subject uses raw (CRLF-stripped) values, NOT HTML-encoded, since email subjects
  // are plain text (HTML entities like &amp; would display literally).
  const subject = "\uD83C\uDFC1 New League Application: " + applicant.firstName + " " + applicant.lastName + " (" + applicant.iracingName + ")";

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #050806; color: #ffffff; padding: 28px; border-radius: 8px; border: 1px solid #223529;">
      <div style="border-bottom: 2px solid #28e564; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #28e564; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 0.05em;">
          🏁 New League Application
        </h2>
        <p style="color: #c8d1cb; font-size: 13px; margin: 6px 0 0;">Received: ${formattedDate}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
        <tr style="background-color: #0d130f;">
          <td style="padding: 10px 14px; font-weight: bold; width: 40%; border-bottom: 1px solid #223529; color: #c8d1cb;">Applicant Name</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #ffffff;"><strong>${safeFirst} ${safeLast}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">iRacing Driver Name</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #28e564;"><strong>${safeIracingName}</strong></td>
        </tr>
        <tr style="background-color: #0d130f;">
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">Current iRating</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #4ade80;"><strong>${safeIrating}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">Safety Rating</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #ffffff;">${safeSafety}</td>
        </tr>
        <tr style="background-color: #0d130f;">
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">iRacing Customer ID</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #ffffff;">${safeCustomerId}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">Email Address</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529;"><a href="mailto:${encodeURIComponent(applicant.email)}" style="color: #4ade80; text-decoration: none;">${safeEmail}</a></td>
        </tr>
        <tr style="background-color: #0d130f;">
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">Discord Username</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #ffffff;"><strong>${safeDiscord}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">iRacing Experience</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #ffffff;">${safeExperience}</td>
        </tr>
        <tr style="background-color: #0d130f;">
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb; vertical-align: top;">What They Are Looking For</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #ffffff;">${safeLookingFor || '<em>None specified</em>'}</td>
        </tr>
      </table>

      <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #223529; text-align: center;">
        <a href="mailto:${encodeURIComponent(applicant.email)}?subject=LeeOnTrack%20League%20Application%20Update" style="display: inline-block; background-color: #28e564; color: #050806; font-weight: bold; text-decoration: none; padding: 10px 20px; border-radius: 4px; text-transform: uppercase; font-size: 13px;">
          Reply to ${safeFirst}
        </a>
      </div>
    </div>
  `;

  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: subject,
      htmlBody: htmlBody,
      replyTo: applicant.email
    });
  } catch (err) {
    Logger.log("Failed to send admin notification email: " + err.toString());
  }
}


/**
 * Helper to build JSON responses.
 */
function createJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function: Run this directly in Apps Script editor to authorize and verify!
 */
function testSubmission() {
  const fakeEvent = {
    parameter: {
      "First Name": "Lewis",
      "Last Name": "Hamilton",
      "iRacing Driver Name": "Lewis Hamilton44",
      "Safety Rating": "A 4.99",
      "iRating": "1950",
      "iRacing Customer ID": "123456",
      "Email Address": ADMIN_EMAIL,
      "Discord Username": "LH44#0001",
      "iRacing Experience": "6 months",
      "What They Are Looking For": "Testing hardened security backend!",
      "Confirm Under 2000": "on",
      "Read Rules": "on",
      "Agree Rules": "on",
      "Friendly League": "on",
      "Organiser Decisions": "on"
    }
  };

  const response = doPost(fakeEvent);
  Logger.log("Test Result: " + response.getContent());
}
