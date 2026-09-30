/**
 * ============================================================================
 * LeeOnTrack League Application Backend (Google Apps Script)
 * ============================================================================
 * 
 * Handles incoming applications from application.html on https://www.leeontrack.co.uk:
 * 1. Appends driver application details to the "Applications" Google Sheet.
 * 2. Sends an instant notification email to leeontrack5@gmail.com with formatted details.
 * 3. Sends an automated confirmation receipt email to the applicant.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open Google Sheets (https://sheets.new) under your leeontrack5@gmail.com account.
 * 2. Name your spreadsheet: "LeeOnTrack Driver Applications".
 * 3. Click Extensions > Apps Script.
 * 4. Delete any code in Code.gs and paste this entire file.
 * 5. Click Save (floppy disk icon).
 * 6. Click Deploy > New deployment.
 * 7. Select type: "Web app".
 * 8. Set:
 *    - Description: "LeeOnTrack Application Backend"
 *    - Execute as: "Me (leeontrack5@gmail.com)"
 *    - Who has access: "Anyone" (CRITICAL: must be Anyone so visitors can submit).
 * 9. Click Deploy, authorize permissions when prompted.
 * 10. Copy the Web App URL (starts with https://script.google.com/macros/s/...)
 * 11. Paste that URL into application.html (or assets/js/main.js).
 * ============================================================================
 */

const ADMIN_EMAIL = "leeontrack5@gmail.com";
const SHEET_NAME = "Applications";

/**
 * Handles HTTP POST requests from the website form.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Wait up to 30 seconds to acquire lock so concurrent submissions do not conflict
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

    const doc = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = doc.getSheetByName(SHEET_NAME);

    // If sheet doesn't exist, create it
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
    const firstName = (data["First Name"] || data["firstName"] || "").trim();
    const lastName = (data["Last Name"] || data["lastName"] || "").trim();
    const iracingName = (data["iRacing Driver Name"] || data["iracingName"] || "").trim();
    const safetyRating = (data["Safety Rating"] || data["safetyRating"] || "").trim();
    const irating = (data["iRating"] || data["irating"] || "").toString().trim();
    const customerId = (data["iRacing Customer ID"] || data["customerId"] || "").toString().trim();
    const email = (data["Email Address"] || data["email"] || "").trim();
    const discord = (data["Discord Username"] || data["discord"] || "").trim();
    const experience = (data["iRacing Experience"] || data["experience"] || "").trim();
    const lookingFor = (data["What They Are Looking For"] || data["lookingFor"] || "").trim();

    const confirmUnder2000 = data["Confirm Under 2000"] ? "Yes" : "No";
    const readRules = data["Read Rules"] ? "Yes" : "No";
    const agreeRules = data["Agree Rules"] ? "Yes" : "No";
    const friendlyLeague = data["Friendly League"] ? "Yes" : "No";
    const organiserDecisions = data["Organiser Decisions"] ? "Yes" : "No";

    // Append driver row to Google Sheet
    sheet.appendRow([
      timestamp,
      firstName,
      lastName,
      iracingName,
      safetyRating,
      irating,
      customerId,
      email,
      discord,
      experience,
      lookingFor,
      confirmUnder2000,
      readRules,
      agreeRules,
      friendlyLeague,
      organiserDecisions
    ]);

    // Send Admin Notification Email
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

    // Send Applicant Confirmation Email (if valid email provided)
    if (email && email.indexOf("@") !== -1) {
      sendApplicantEmail({
        firstName: firstName,
        email: email,
        iracingName: iracingName
      });
    }

    return createJsonResponse({
      status: "success",
      message: "Application submitted successfully."
    });

  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return createJsonResponse({
      status: "error",
      message: error.toString()
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
    service: "LeeOnTrack Applications API",
    timestamp: new Date().toISOString()
  });
}

/**
 * Sends a notification email to league organizers.
 */
function sendAdminEmail(applicant) {
  const formattedDate = Utilities.formatDate(applicant.timestamp, "Europe/London", "dd MMM yyyy, HH:mm 'UK'");
  const subject = `🏁 New League Application: ${applicant.firstName} ${applicant.lastName} (${applicant.iracingName})`;

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
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #ffffff;"><strong>${applicant.firstName} ${applicant.lastName}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">iRacing Driver Name</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #28e564;"><strong>${applicant.iracingName}</strong></td>
        </tr>
        <tr style="background-color: #0d130f;">
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">Current iRating</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #4ade80;"><strong>${applicant.irating}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">Safety Rating</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #ffffff;">${applicant.safetyRating}</td>
        </tr>
        <tr style="background-color: #0d130f;">
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">iRacing Customer ID</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #ffffff;">${applicant.customerId}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">Email Address</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529;"><a href="mailto:${applicant.email}" style="color: #4ade80; text-decoration: none;">${applicant.email}</a></td>
        </tr>
        <tr style="background-color: #0d130f;">
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">Discord Username</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #ffffff;"><strong>${applicant.discord}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb;">iRacing Experience</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #ffffff;">${applicant.experience}</td>
        </tr>
        <tr style="background-color: #0d130f;">
          <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #223529; color: #c8d1cb; vertical-align: top;">What They Are Looking For</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #223529; color: #ffffff;">${applicant.lookingFor ? applicant.lookingFor.replace(/\n/g, '<br>') : '<em>None specified</em>'}</td>
        </tr>
      </table>

      <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #223529; text-align: center;">
        <a href="mailto:${applicant.email}?subject=LeeOnTrack%20League%20Application%20Update" style="display: inline-block; background-color: #28e564; color: #050806; font-weight: bold; text-decoration: none; padding: 10px 20px; border-radius: 4px; text-transform: uppercase; font-size: 13px;">
          Reply to ${applicant.firstName}
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
 * Sends a confirmation receipt email to the driver who applied.
 */
function sendApplicantEmail(applicant) {
  const subject = "LeeOnTrack League Application Received 🏁";

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050806; color: #ffffff; padding: 28px; border-radius: 8px; border: 1px solid #223529;">
      <h2 style="color: #28e564; margin-top: 0; font-size: 22px;">Hi ${applicant.firstName},</h2>
      <p style="color: #c8d1cb; font-size: 15px; line-height: 1.6;">
        Thank you for applying to join the <strong>LeeOnTrack</strong> iRacing league! We've successfully received your application for driver <strong>${applicant.iracingName}</strong>.
      </p>
      <p style="color: #c8d1cb; font-size: 15px; line-height: 1.6;">
        Our organizers will review your application details and get in touch with you soon via Discord or email.
      </p>
      <div style="background-color: #0d130f; border: 1px solid #223529; border-radius: 6px; padding: 18px; margin: 20px 0; text-align: center;">
        <p style="color: #ffffff; font-size: 15px; margin: 0 0 12px; font-weight: 600;">Make sure you are in our Discord:</p>
        <a href="https://discord.gg/DKzfz8Q8Pd" style="display: inline-block; background-color: #5865F2; color: #ffffff; text-decoration: none; font-weight: bold; padding: 10px 22px; border-radius: 4px; font-size: 14px;">
          Join LeeOnTrack Discord
        </a>
      </div>
      <p style="color: #7b8e82; font-size: 13px; line-height: 1.5; margin-top: 25px; border-top: 1px solid #223529; padding-top: 15px;">
        LeeOnTrack League Racing &bull; Friendly racing for under 2000 iRating drivers.<br>
        Website: <a href="https://www.leeontrack.co.uk" style="color: #28e564; text-decoration: none;">www.leeontrack.co.uk</a>
      </p>
    </div>
  `;

  try {
    MailApp.sendEmail({
      to: applicant.email,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (err) {
    Logger.log("Failed to send applicant confirmation email: " + err.toString());
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
 * Test function: run this directly in the Apps Script editor to test
 * permissions, sheet appending, and email delivery!
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
      "What They Are Looking For": "Testing the new backend integration!",
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
