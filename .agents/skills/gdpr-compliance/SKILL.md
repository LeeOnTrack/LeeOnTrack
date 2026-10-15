---
name: gdpr-compliance
description: Audit the project codebase for GDPR data protection, consent mechanisms, and privacy compliance requirements.
---

# GDPR Compliance Audit Procedure

Perform a comprehensive privacy audit on this project by executing the following steps:

1. **Audit Data Collection & Consent Mechanisms**
   - Check if explicit, opt-in user consent is captured before storing personal data, setting tracking/analytics cookies, or launching third-party scripts.
   - *Verification:* Ensure cookie banners or preference centers block tracking tags by default until consent is explicitly granted.

2. **Inspect User Rights & Data Management Endpoints**
   - Verify that data subject access requests (DSARs), data deletion ("Right to be Forgotten"), and data export routes are implemented correctly and securely authenticated.
   - *Verification:* Confirm backend controllers properly handle user-requested record purges or anonymization routines.

3. **Check Data Security, Encryption, and Minimization**
   - Review database models, logs, and storage layers to ensure personal data (PII) is minimized, encrypted at rest, and transmitted securely via HTTPS.
   - *Verification:* Check that sensitive fields (e.g., passwords, tokens, unnecessary identity markers) are not unnecessarily exposed in API responses or application logs.

4. **Review Legal Documentation and Policy Links**
   - Confirm that clear, accessible Privacy Policy and Terms of Service links are present in user-facing views (especially near forms and registration areas).
   - *Verification:* Output a compliance report outlining any missing consent triggers, unencrypted PII storage, or missing data retention workflows.