# SwipeBox: Multi-User Architecture Plan

## Where We Are Today

SwipeBox currently runs as a single-user app. Here's what that means technically:

- **Auth**: Google OAuth tokens are stored in a browser cookie (`swipebox_accounts`). There's no concept of a "SwipeBox user" — whoever is on that browser IS the user.
- **Data**: All user preferences (swipe mappings, stats, history, unsubscribed senders) live in `localStorage` and cookies. Nothing is in a database.
- **AI**: Anthropic API calls for email summaries/replies happen server-side with your API key in `.env.local`. No per-user metering.
- **Hosting**: Vercel free tier, single deployment.

## What Needs to Change (6 Workstreams)

### 1. Database — The Foundation

**Why**: Right now there's no persistent server-side storage. Every user setting, stat, and preference lives in the browser. For multi-user you need a real database to track who's who, who's on free vs paid, invite codes, and ad preferences.

**Recommended**: Vercel Postgres (built into your existing Vercel setup) or Supabase (free tier, great auth integration).

**Tables needed**:
- `users` — id, email, name, avatar, plan (free/pro), invite_code_used, created_at
- `invite_codes` — code, created_by, used_by, expires_at
- `user_settings` — user_id, swipe_mappings, preferences (JSON)
- `user_stats` — user_id, emails_processed, sent, read, snoozed, unsubscribed
- `subscriptions` — user_id, plan, stripe_customer_id, status, current_period_end

### 2. User Identity Layer

**Why**: Today, the OAuth callback just dumps tokens into a cookie. For multi-user, the callback needs to create or find a user record in the database, then issue a session.

**Changes**:
- OAuth callback → look up or create user in `users` table
- Check if user has a valid invite code (for waitlist gating)
- Create a session token (JWT or database session) that identifies the user across requests
- All API routes check session → look up user → then proceed

### 3. Invite-Only Waitlist System

**How it works**:
- You generate invite codes (a simple admin page or even a script)
- New users hit a "Join SwipeBox" page → enter invite code → proceed to Google sign-in
- Invalid or used codes get rejected
- You can give codes to friends, post them selectively, create a waitlist form

### 4. Ad System (Free Tier)

**How it works**:
- Every N cards (e.g., every 5th email), insert an "ad card" into the email stack
- Ad cards look like email cards but are clearly marked as sponsored
- Swiping on an ad card dismisses it (right) or opens the advertiser link (tap)
- Pro users skip ads entirely — the ad insertion logic checks `user.plan`

**Revenue options to start**:
- Google AdSense / AdMob (easy, automated)
- Direct sponsorships (higher value, manual)
- Affiliate cards (recommend products, earn per click)

### 5. Stripe Payments (Pro Tier)

**What Pro removes**: Ads. That's the core value prop — clean, uninterrupted email triage.

**Setup**:
- Stripe Checkout for subscription ($X/month)
- Webhook endpoint to update `subscriptions` table when payment succeeds/fails
- Pro badge in the UI, plan management in Settings

### 6. Google OAuth Scaling

**Important**: Right now your Google Cloud project is probably in "Testing" mode, which limits OAuth to 100 users you manually add. To accept anyone:
- Submit your app for Google OAuth verification (takes 2-4 weeks)
- Requires a privacy policy page and terms of service
- Requires a homepage URL
- May require a security assessment if you request sensitive scopes

This is the **longest lead-time item** — start it first.

---

## Recommended Order of Execution

| Phase | Work | Why This Order |
|-------|------|----------------|
| **Phase 0** | Submit Google OAuth for verification | 2-4 week review process — start NOW |
| **Phase 1** | Add database + user identity layer | Foundation everything else depends on |
| **Phase 2** | Invite code system | Gates access while you're in beta |
| **Phase 3** | Ad card system (free tier) | Revenue from day one |
| **Phase 4** | Stripe integration (pro tier) | Monetization complete |
| **Phase 5** | Landing page + waitlist form | Growth engine |

---

## Implementation Prompt

Copy and paste the prompt below when you're ready to start building. It's written to be given in one shot and covers Phase 1 + 2 (database + invite system), which is the critical first step.

---

```
I want to add multi-user support to SwipeBox. Here's the current architecture:
- Next.js 14 App Router on Vercel
- Google OAuth stores tokens in httpOnly cookie (swipebox_accounts)
- All user data (stats, settings, swipe mappings) is in localStorage/cookies
- No database exists yet

PHASE 1: DATABASE + USER IDENTITY

1. Set up Vercel Postgres (or Supabase — your recommendation) with these tables:
   - users: id mod, email, name, avatar_url, plan ('free'/'pro'), created_at, last_login
   - invite_codes: id, code (unique 8-char), created_by, used_by, used_at, expires_at
   - user_settings: user_id (FK), swipe_mappings (JSON), preferences (JSON)

2. Modify the OAuth callback (app/api/auth/gmail/callback/route.js) to:
   - After getting tokens + email from Google, look up or create user in users table
   - Create a session (JWT stored in httpOnly cookie, or use next-auth)
   - Store the Google tokens associated with the user in the database (encrypted)
   - Redirect to the app

3. Create a middleware or helper that:
   - Reads the session cookie on every API request
   - Looks up the user
   - Rejects unauthenticated requests
   - Makes user data available to all API routes

4. Migrate localStorage data to database:
   - swipe_mappings → user_settings table
   - stats → keep in localStorage for speed but sync to DB periodically
   - unsubscribed senders → user_settings.preferences

PHASE 2: INVITE-ONLY ACCESS

5. Create an invite gate page:
   - Before Google OAuth, user must enter a valid invite code
   - Validate against invite_codes table (unused, not expired)
   - On successful validation, proceed to Google sign-in
   - Mark code as used after successful signup

6. Create a simple admin route (protected, only my email can access):
   - POST /api/admin/invites — generate N invite codes
   - GET /api/admin/invites — list all codes and their status
   - GET /api/admin/users — list all users

IMPORTANT CONSTRAINTS:
- Don't break the existing single-user flow while building this
- Keep the warm editorial Echoes design for any new UI (cream/beige, Playfair Display headings, Georgia body, warm muted colors)
- Mobile-first — the invite code page should work great on phones
- The app should still work with localStorage as a fallback if DB is slow
- Ask me before choosing between Vercel Postgres vs Supabase vs another option
```

---

```
PHASE 3: AD CARDS (Free Tier Revenue)

I want to add ad cards to the email swiping experience for free-tier users.

How it should work:
- Every 5th card in the stack should be an ad card instead of an email
- Ad cards should look similar to email cards but clearly marked as "Sponsored"
- They use the same warm editorial design (cream card, warm shadows, serif fonts)
- Tapping an ad card opens the advertiser URL
- Swiping right dismisses the ad
- Swiping left/up/down also dismisses (no action needed)
- Pro users (user.plan === 'pro') never see ad cards

Implementation:
- Create an AdCard component styled like EmailCard but with a "Sponsored" tag
- Create an ad serving system — start simple with a JSON config of ad creatives (image, title, description, url, sponsor name)
- Insert ad cards into the email array at every 5th position in page.js
- Track ad impressions and clicks (store in DB for future analytics)
- The ad insertion happens client-side after emails load, checking user.plan first

Ask me before deciding on the ad format (banner-style vs card-style vs native content).
```

---

```
PHASE 4: STRIPE PAYMENTS (Pro Tier)

Add Stripe subscription payments so users can upgrade to Pro (removes ads).

Setup:
- Install stripe package
- Create /api/stripe/checkout — generates a Stripe Checkout session for the Pro plan
- Create /api/stripe/webhook — handles subscription events (payment success, cancellation, failure)
- Update the users/subscriptions table when payment status changes
- Add "Upgrade to Pro" button in Settings (warm editorial style)
- Add a simple Pro badge next to the user's name
- Pro plan price: ask me before setting

The upgrade flow:
1. User taps "Remove Ads — Upgrade to Pro" in Settings
2. Redirected to Stripe Checkout (hosted page)
3. After payment, webhook fires → update user.plan to 'pro'
4. User returns to app, ads disappear immediately

Keep it simple — one plan, monthly billing, cancel anytime.
```
