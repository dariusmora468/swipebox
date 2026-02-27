# CHANGELOG

All notable changes to SwipeBox are documented here. Most recent changes at top.

---

## [0.5.0] - 2026-02-27

### Added
- Structured JSON logging utility (`lib/logger.js`) with `logError`, `logWarn`, `logInfo`, and `logRequest` helpers
- Stack traces included in development mode only for easier debugging
- Contextual log tags (e.g. `api:emails`, `gmail:fetchAllAccountEmails`) for filtering

### Fixed
- Silent catch blocks in `lib/gmail.js`, `lib/snooze.js`, and `app/api/emails/route.js` now log warnings instead of swallowing errors
- Replaced all bare `console.error` calls across 8 server files with structured logger
- Corrected relative import paths for nested API routes that caused build failure

---

## [0.4.0] - 2026-02-27

### Added
- Persist action counts (sent, read, snoozed, unsubscribed) to localStorage
- Persist undo history to localStorage
- Stats and history now survive page refreshes
- Lazy state initialization from localStorage for both stats and history

### Fixed
- Variable name mismatch in email route catch block (e -> err)

## [e15862f] - 2026-02-27
### Fix: Implement fetchAllAccountEmails and proper error handling
- **Root cause identified:** `fetchAllAccountEmails` was imported by the email API route but never implemented in `gmail.js`. The import resolved to `undefined`, causing a TypeError on every call, which was silently caught and returned as an empty array Ã¢ÂÂ making the app show "Inbox Zero" instead of an error.
- **Files modified:**
  - `lib/gmail.js` - Added `fetchAllAccountEmails()` function that fetches emails from Gmail API for all connected accounts using `gmail.users.messages.list` and `gmail.users.messages.get`, with proper auth error propagation
  - `app/api/emails/route.js` - Updated catch block to detect auth errors via `isAuthError` flag, `error.code === 401`, or `invalid_grant` message
  - `app/page.js` - Added `fetchError` state, error handling for non-200 API responses, and a full-screen error UI with "Try Again" and "Reconnect Gmail" buttons

## [b681dea] - 2026-02-27
### Refactor: Split page.js monolith into modular components
- **Files added:**
  - `lib/constants.js` - ACTION_ICONS and SNOOZE_OPTIONS configuration
  - `lib/snooze.js` - Snooze utility functions (getSnoozeTime, getSnoozedEmails, addSnoozedEmail, clearExpiredSnoozes)
  - `components/SnoozePicker.js` - Snooze time picker component (44 lines)
  - `components/ActionBadge.js` - Action count badge component (28 lines)
  - `components/EmailModal.js` - Email detail modal component (218 lines)
  - `components/UnsubscribeOverlay.js` - Unsubscribe confirmation overlay (49 lines)
  - `components/SettingsModal.js` - Settings modal component (81 lines)
  - `components/GoogleIcon.js` - Google SVG icon component (10 lines)
  - `components/EmailCard.js` - Swipeable email card component (176 lines)
  - `components/ActionButton.js` - Action button with animation (19 lines)
  - `components/CompletionScreen.js` - Inbox zero completion screen (25 lines)
  - `components/LoadingScreen.js` - Loading spinner screen (8 lines)
  - `components/LoginScreen.js` - Gmail login screen (13 lines)
- **Files modified:**
  - `app/page.js` - Reduced from 1108 lines (57KB) to 338 lines (17KB), now contains only SwipeBox main component with imports
- **Impact:** No functional changes. Pure refactor for maintainability.

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
