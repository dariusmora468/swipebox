# CHANGELOG

All notable changes to SwipeBox are documented here. Most recent changes at top.

---

## 2026-02-26

### 4a9c8aa - fix: Improve email body sanitization for clean modal formatting
- **Files:** `lib/gmail.js`
- Rewrote `stripHtml()` function with comprehensive HTML cleaning
- Removes HTML comments, tracking pixels, standalone URLs, separator lines
- Better entity decoding (arrows, thin spaces, zero-width chars)
- Per-line trimming and newline normalization

### 6fa6b7a - fix: Use JSX syntax for modal body paragraphs (fixes client-side crash)
- **Files:** `app/page.js`
- Replaced `React.createElement()` with JSX in EmailModal body rendering
- Added null safety (`|| ""`) for email body/preview
- Fixed "Application error: a client-side exception has occurred" on email tap

### d9a0735 - fix: Clean email body formatting and show AI summary on cards
- **Files:** `app/page.js`, `lib/gmail.js`
- EmailCard preview now shows `email.summary` instead of raw `email.preview`
- Added CSS `-webkit-line-clamp: 3` for clean text truncation on cards
- EmailModal body now renders paragraphs with line breaks

### bcec2e7 - feat: Replace swipe-down delete with unsubscribe flow
- **Files:** `app/page.js`, `app/api/emails/unsubscribe/route.js`
- Swipe down now triggers unsubscribe instead of delete
- Detects List-Unsubscribe headers for one-click unsubscribe
- Falls back to finding unsubscribe links in email body

### 731b90b - fix: Fix import path in remove/route.js (5 levels up)
- **Files:** `app/api/auth/gmail/remove/route.js`

### aa8df5e - fix: Remove duplicate content in layout.js
- **Files:** `app/layout.js`

### fb52e1d - fix: Remove duplicate content in action/route.js
- **Files:** `app/api/emails/action/route.js`

### 32f0c50 - fix: Remove duplicate content in ai.js
- **Files:** `lib/ai.js`

### 59a86b5 - feat: Add account removal endpoint
- **Files:** `app/api/auth/gmail/remove/route.js`
- POST endpoint to disconnect a Gmail account
- Removes account tokens from the accounts cookie

### b81c348 - feat: Premium SwipeBox UI with swipe gestures, AI replies, snooze, multi-account
- **Files:** `app/page.js`, `lib/gmail.js`, `lib/ai.js`, all API routes
- Complete UI rebuild with dark theme and swipe gesture controls
- Framer Motion swipe: right=archive, left=reply, up=snooze, down=unsubscribe
- AI-powered email summaries and smart reply generation (Claude)
- Multi-account Gmail support with account switcher
- Snooze functionality with configurable durations
- Email detail modal with formatted body display
- Action tracking (archive, reply, snooze, unsubscribe counts)

---

## Known Issues

1. **page.js is a 57KB monolith** (1108 lines, 18 components) - should be split
2. **Action counts reset on page refresh** - stored in React state, not persisted
3. **OAuth errors show as "Inbox Zero"** - try/catch returns empty array instead of error UI
4. **No error logging** - server-side errors are silently swallowed
5. **No tests** - zero test coverage
6. **GitHub PAT exposed in chat** - needs rotation after each working session
