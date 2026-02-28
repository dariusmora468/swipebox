# SwipeBox — Project Reference

## What is SwipeBox?
A mobile-first email triage app. Users swipe through their Gmail inbox like a card deck: right to mark read, left to snooze, down to unsubscribe + trash, up to send an AI-drafted reply. Built as a PWA (web app saved to home screen), not a native app.

## Owner
Darius Mora — hello@dariusmora.com

## Stack & Deployment
- **Framework:** Next.js 14 (App Router), React 18, all components use `'use client'`
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`) for email summarization and reply drafting
- **Email:** Gmail API via `googleapis` — OAuth tokens stored in `gmail_accounts` cookie
- **Animations:** Framer Motion + custom pointer event handling for swipe gestures
- **Hosting:** Vercel (auto-deploys from `main` branch)
- **Repo:** github.com/dariusmora468/swipebox
- **Live URL:** swipebox-six.vercel.app
- **Tests:** Jest + React Testing Library (`npm test`)

## Critical Production Constraints
1. **Vercel filesystem is read-only.** Never use `fs.writeFileSync` or `fs.mkdirSync` in API routes that run in production. Use in-memory defaults with optional file-based fallback wrapped in try/catch.
2. **Sandbox proxy blocks `git push`.** Darius must push from his local terminal: `cd ~/swipebox && git add -A && git commit -m "message" && git push`
3. **Most websites block iframes** (X-Frame-Options, CSP). Never try to load third-party pages in an iframe — use `window.open(url, '_blank')` instead.
4. **Gmail API `maxResults` caps batch size** (currently 20). Use `resultSizeEstimate` from the list response for the real total unread count.
5. **Cookie-based auth.** Tokens live in `swipebox_accounts` cookie. Unsubscribed senders tracked in `swipebox_unsubscribed` cookie (base64 JSON).

## Design System (Echoes)
- **Background:** `#F5F0EB` (cream)
- **Cards:** `#FDFBF9` with `rgba(120,100,80,0.1)` borders
- **Primary accent:** `#A0775A` (warm brown)
- **Headings font:** `'Playfair Display', Georgia, serif`
- **Body font:** `Georgia, serif`
- **Action colors:** Right `#A0775A`, Left `#B8963E`, Up `#7A8C6E`, Down `#B07070`
- **Muted text:** `#9C8E82`, Dark text: `#2C2520`, Medium text: `#6B5E54`

## App Flow (in order)
1. **LandingPage** — animated card demo, waitlist signup, promo code entry
2. **Onboarding** — 5-step interactive swipe tutorial (skippable)
3. **LoginScreen** — Gmail OAuth connect
4. **Main UI** — email card stack with swipe actions, undo, settings, stats

### State gating (page.js)
```
isAuthenticated === null → LoadingScreen
isAuthenticated === false + appView 'landing' → LandingPage
isAuthenticated === false + appView 'onboarding' → Onboarding
isAuthenticated === false → LoginScreen
isAuthenticated === true → Main swiping UI
```

### localStorage flags
- `swipebox_onboarded` — skips landing/onboarding on return visits
- `swipebox_promo_validated` / `swipebox_promo_code` — promo code state
- `swipebox_stats` — session stats (sent/read/snoozed/unsubscribed)
- `swipebox_history` — undo history
- `swipebox_unsubscribed` — list of unsubscribed senders
- `swipebox_swipe_mappings_v*` — custom swipe direction → action mappings

## Key Architecture Decisions
- **Optimistic updates with rollback.** Email removed from UI immediately on swipe. If the API call fails, the email is restored to the front of the list and stats are decremented.
- **Fly-away animation.** On swipe, card flies 600px in the swipe direction (0.35s ease-in) with opacity fade, instead of snapping back to center.
- **Unsubscribe: two methods.** (1) RFC 8058 one-click POST — server-side, automatic. (2) Link-based — opens URL in new browser tab via `window.open`. Falls back from one-click to link if the POST returns non-200 or throws.
- **Promo codes** are hardcoded in DEFAULT_CODES array (TEST, BETA2026, FRIENDS, SWIPEBOX). File-based storage is optional fallback for local dev only.
- **Undo** reverses only the last action. Uses `undoMarkRead` (adds INBOX+UNREAD labels back) or `untrashEmail` (untrash + add labels).

## File Map

### API Routes (`app/api/`)
| Route | Purpose |
|-------|---------|
| `emails/route.js` | Fetch inbox (GET) — returns emails + totalUnread |
| `emails/action/route.js` | Execute action (POST) — mark_read, delete, snooze, send, undo |
| `emails/unsubscribe/route.js` | Unsubscribe (POST) — one-click or link extraction |
| `auth/gmail/route.js` | OAuth initiate |
| `auth/gmail/callback/route.js` | OAuth callback |
| `auth/gmail/remove/route.js` | Remove account |
| `auth/signout/route.js` | Clear session |
| `promo/route.js` | Validate invite code |
| `waitlist/route.js` | Join waitlist + notify Darius |

### Core Components (`components/`)
| Component | Purpose |
|-----------|---------|
| `EmailCard.js` | Swipeable card with gesture handling, fly-away animation |
| `LandingPage.js` | Marketing page with animated demo, waitlist, promo code |
| `Onboarding.js` | 5-step interactive swipe tutorial |
| `LoginScreen.js` | Gmail OAuth connect screen |
| `SettingsModal.js` | Account management, sign out |
| `SwipeSettingsModal.js` | Customize swipe direction → action mappings |
| `ComposeCard.js` | AI reply editor before sending |
| `SnoozePicker.js` | Snooze duration selector |
| `UnsubscribeOverlay.js` | (Legacy — no longer used, kept for reference) |
| `CompletionScreen.js` | Inbox zero celebration |
| `CelebrationOverlay.js` | Halfway/completion animations |

### Libraries (`lib/`)
| Module | Purpose |
|--------|---------|
| `gmail.js` | Gmail API wrapper — fetch, mark read, trash, untrash, send |
| `ai.js` | Anthropic API — email categorization, summary, reply drafting |
| `snooze.js` | Client-side snooze tracking with expiry |
| `gamification.js` | XP, streaks, combos |
| `logger.js` | Structured logging (logError, logWarn) |
| `constants.js` | Shared constants |

## Common Pitfalls & Past Bugs
1. **Promo codes failing on Vercel** — filesystem writes crash. Always use in-memory defaults.
2. **Email count showing "20"** — was using `emailList.length` (capped by maxResults) instead of Gmail's `resultSizeEstimate`.
3. **Unsubscribe "not working"** — iframe blocked by most sites. Fixed by using `window.open` instead.
4. **Swipe bounce-back** — card snapped to center during API call. Fixed with optimistic updates + fly-away animation.
5. **Git lock files** — `.git/HEAD.lock` / `.git/index.lock` can block commits. Remove them if stuck.
6. **Stats resetting on reload** — `totalProcessed` was recalculated from zeroed stats. Fixed by using `initialEmailCount` set once at fetch time.
