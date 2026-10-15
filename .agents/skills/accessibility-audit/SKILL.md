---
name: accessibility-audit
description: Review frontend UI templates for WCAG accessibility standards, proper ARIA attributes, semantic HTML, and keyboard navigation.
---

# ARIA & Accessibility (WCAG) Audit Procedure

Perform an accessibility and ARIA compliance audit across the project's frontend templates and components:

1. **Verify Semantic HTML Structure**
   - Inspect components to ensure proper use of semantic landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`, `<article>`).
   - *Verification:* Check that elements aren't overly reliant on generic `<div>` or `<span>` wrappers for interactive sections.

2. **Check ARIA Attributes and Roles**
   - Verify that dynamic widgets, modals, tabs, dropdowns, and buttons include correct ARIA attributes (`aria-expanded`, `aria-hidden`, `aria-live`, `aria-label`, role definitions).
   - *Verification:* Ensure screen-reader-only text (`sr-only`) or explicit labels are provided for icon-only buttons or dynamic states.

3. **Evaluate Keyboard Navigation & Focus Management**
   - Check that interactive elements are keyboard focusable, logical in tab order, and feature visible focus rings.
   - *Verification:* Ensure modal popups trap focus correctly and can be dismissed using the `Escape` key.

4. **Inspect Color Contrast and Media Accessibility**
   - Check styling sheets and Tailwind/CSS definitions for compliant color contrast ratios and ensure all `<img>` tags include meaningful `alt` text (or `alt=""` for decorative images).
   - *Verification:* Output a remediation list flagging missing image descriptions, improper ARIA states, or broken keyboard navigation paths.