---
name: security-audit
description: Scan the project codebase for security vulnerabilities, exposed secrets, and insecure dependencies.
---

# Security Audit Procedure

Perform a comprehensive security audit on this project by executing the following steps:

1. **Scan Dependencies for Known Vulnerabilities**
   - Identify the project's package manager and run the appropriate audit command (e.g., `npm audit`, `pip-audit`, `cargo audit`, or `govulncheck`).
   - *Verification:* Confirm that all installed packages are checked against known vulnerability databases and list any high or critical advisories found.

2. **Check for Hardcoded Secrets and Sensitive Data**
   - Search the codebase for accidental hardcoded API keys, passwords, connection strings, and private keys.
   - *Verification:* Ensure all source files and configuration templates (`.env.example`) are free of exposed production secrets.

3. **Review OWASP Top 10 Application Risks**
   - Inspect source files for critical logic vulnerabilities, including unvalidated inputs, SQL/NoSQL injection paths, Cross-Site Scripting (XSS) vectors, and insecure direct object references (IDOR).
   - *Verification:* Verify that user input handling and data sanitization routines are implemented correctly.

4. **Inspect Configuration & Headers**
   - Check server configuration, CORS policies, cookie security flags (HttpOnly, Secure, SameSite), and security headers.
   - *Verification:* Output a final summary report detailing identified vulnerabilities, severity ratings, and concrete remediation recommendations.