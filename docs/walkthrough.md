# PEP Mail Walkthrough & QA Guide

Welcome to the Final QA (Phase 13) of the PEP Mail platform! This guide outlines exactly what features have been built, the manual verification testing steps required to ensure total stability, and the security audits performed to guarantee data integrity.

## Architecture Highlights
- **Next.js 16 App Router (Turbopack)**: Blazing fast SSR with Server Components.
- **Supabase**: Robust authentication (with MFA enforcement), auto-scaling PostgreSQL, and highly secure RLS policies.
- **TipTap Composer**: A modern, flexible rich text editing experience.
- **Resend + Svix**: Highly resilient webhook processing with rigorous signature validation.
- **Upstash Redis**: Global rate-limiting to protect vital API endpoints.

> [!IMPORTANT]
> To thoroughly test the platform, please ensure you have your `.env.local` fully populated with active API keys for Supabase, Resend, Svix, and Upstash Redis.

---

## Final Manual Verification Test Cases (37 Points)

### Authentication & Security
1. **Sign Up block**: Verify that attempting to sign up natively fails or is redirected (system is invite-only by an admin).
2. **Login flow**: Enter valid credentials and successfully receive an MFA prompt.
3. **MFA Enforced**: Login flow must strictly redirect to `/mfa/setup` or `/mfa/verify`.
4. **MFA Setup**: Successfully scan the QR code and register an Authenticator App.
5. **MFA Verify**: Submit a valid code and successfully reach `/inbox`.
6. **MFA Denial**: Entering an invalid code must reject entry and preserve unauthenticated state.
7. **Session Expiry**: Clear cookies and verify instant redirect to `/login` when trying to access `/inbox`.

### Layout & Navigation
8. **Sidebar active state**: Clicking "Sent" highlights the "Sent" tab.
9. **Collapsible Sidebar**: Verify the hamburger menu expands/collapses the sidebar seamlessly.
10. **TopBar display**: Verifies current path breadcrumbs dynamically update.
11. **User Profile Dropdown**: Clicking the avatar opens the menu allowing secure logout.
12. **Notification Bell UI**: Click the bell to open the Notification Center drawer.

### Inbox & Email List
13. **Inbox rendering**: Fetch and display real emails from the database with correct formatting.
14. **List pagination/scroll**: Scroll through emails to trigger efficient loading (if >50 emails exist).
15. **Unread state styling**: Unread emails appear with bolder text or distinct indicators.
16. **Date formatting**: Email dates show 'Today, 10:45 AM' or short dates based on age.
17. **Empty states**: Visiting 'Trash' with no emails properly renders the empty state illustration.

### Thread View (Reading)
18. **Routing**: Clicking an email properly routes to `/email/[id]`.
19. **Thread Aggregation**: Ensure all emails sharing the same `thread_id` render in chronological order.
20. **Sandboxed HTML Render**: Verify HTML email body renders correctly inside the `<iframe>` sandbox.
21. **XSS Protection**: Attempt to inject `<script>alert('XSS')</script>` in the database; verify the sandbox blocks it.
22. **Attachment Chips**: Verify attachments render as secure chips.
23. **Attachment Download**: Click an attachment chip and successfully download the file via signed URL.

### Composer (Writing)
24. **Global Launch**: Press 'C' from anywhere in the app to open the composer modal.
25. **Rich Text Formatting**: Bold, italicize, and add links using the TipTap editor.
26. **Chip Inputs**: Type an email in the "To" field, hit space/enter, and verify it converts to a unified chip.
27. **Draft Auto-save**: Pause typing for 30 seconds; verify the email saves to the 'Drafts' folder silently.
28. **Drag & Drop Attachment**: Drop a PDF onto the composer; verify the progress bar reaches 100% and it appears.
29. **Send Flow**: Click send; verify the modal closes and a success toast appears.
30. **Sent Folder Delivery**: Check the 'Sent' folder to ensure the email is accurately recorded.

### Webhooks (Resend)
31. **Inbound Webhook**: Send a real email to your configured Resend domain; verify it appears in the inbox within seconds.
32. **Svix Signature Rejection**: Send a raw POST request with an invalid `svix-signature` to `/api/webhooks/resend`; verify it returns a 400 Bad Request.
33. **Idempotency**: Fire the exact same payload twice; verify the database only creates one email row via `resend_events`.

### Admin & CSV Import
34. **Admin Route Guard**: Log in as a non-admin and attempt to access `/admin/users`; verify 403 Forbidden redirect.
35. **CSV Template Download**: Verify the "Download Template" button triggers a valid CSV download.
36. **Valid CSV Import**: Drop a valid CSV; verify success statuses, Magic Link invites via Resend, and DB profiles created.
37. **Rate Limiting & Duplicates**: Attempt to upload a CSV twice within 60 seconds; verify Upstash Redis halts the second request. Verify duplicate emails on the first run are cleanly skipped.

---

## Security Audit Verification
As part of Phase 13, all security and access protocols were verified:
- **`next.config.ts` Headers Active:** `Strict-Transport-Security`, `Content-Security-Policy` (Sandbox strictness), `X-Frame-Options` (DENY), `X-Robots-Tag` (noindex, nofollow) are all explicitly configured.
- **`robots.txt`**: Present and explicitly configured to `Disallow: /`.
- **Supabase RLS Integrity**: Verified in `001_schema.sql` that `emails` uses `USING (owner_id = auth.uid())`, physically preventing Cross-Tenant Data Leakage even if the API route was compromised.
- **TypeScript & ESLint Check**: Completed build processes verify 0 Type errors and warnings across the app (via updated `eslintrc.json` constraints). 

### Final Next Steps for the Developer:
1. Open `.env.local` and populate it with your true keys.
2. Ensure you have seeded at least one admin account in Supabase to start.
3. Spin up the dev server (`npm run dev`).
4. Run through the testing checklist above!
