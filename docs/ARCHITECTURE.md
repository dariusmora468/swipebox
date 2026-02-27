# SwipeBox Architecture Guide

> Last updated: 2026-02-27

## Overview

SwipeBox is an AI-powered email triage app. Users connect their Gmail accounts and swipe through emails like a card deck: right to archive, left to reply, up to snooze, down to unsubscribe. Claude AI generates summaries for each email and drafts smart replies.

**Live URL:** https://swipebox-six.vercel.app  
**Repo:** https://github.com/dariusmora468/swipebox  
**Deployed on:** Vercel (auto-deploy from main branch)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + Framer Motion |
| AI | Anthropic Claude SDK |
| Email | Google Gmail API (googleapis) |
| Auth | Google OAuth 2.0 |
| Hosting | Vercel (serverless) |
| Storage | Cookies (account tokens), React state (session data) |

## Environment Variables

```
GOOGLE_CLIENT_ID        # From Google Cloud Console
GOOGLE_CLIENT_SECRET    # From Google Cloud Console
ANTHROPIC_API_KEY       # From console.anthropic.com
NEXT_PUBLIC_APP_URL     # Production: https://swipebox-six.vercel.app
```

## File Structure

```
swipebox/
+-- .env.example          # Environment variable template
+-- package.json           # Dependencies (next, react, anthropic, googleapis, framer-motion)
+-- next.config.js         # Minimal Next.js config
+-- CHANGELOG.md           # Running log of all changes
+-- SETUP.md               # Original setup guide
+-- docs/
|   +-- ARCHITECTURE.md    # This file
+-- public/
|   +-- manifest.json      # PWA manifest
+-- app/
|   +-- globals.css        # Global styles (dark theme)
|   +-- layout.js          # Root layout with metadata
|   +-- page.js            # ** ENTIRE UI ** (57KB, 1108 lines, 18 components)
|   +-- api/
|       +-- auth/gmail/
|       |   +-- route.js           # GET: Redirect to Google OAuth
|       |   +-- callback/route.js  # GET: Handle OAuth callback, store tokens
|       |   +-- remove/route.js    # POST: Disconnect a Gmail account
|       +-- emails/
|           +-- route.js           # GET: Fetch + parse + AI-summarize emails
|           +-- action/route.js    # POST: Archive, trash, reply, snooze, forward
|           +-- unsubscribe/route.js # POST: Unsubscribe from mailing lists
+-- lib/
    +-- gmail.js           # Gmail API client (21 functions)
    +-- ai.js              # Claude AI integration (2 exports)
```

## Key Files In Detail

### app/page.js (57KB - UI Monolith)

Contains ALL frontend components in a single file. This is the #1 refactoring target.

**Components (18 total):**
- `SwipeBox` - Main app component (default export), manages all state
- `LoginScreen` / `LoadingScreen` / `CompletionScreen` - App states
- `EmailCard` - Swipeable card with email summary (uses Framer Motion)
- `EmailModal` - Expanded email detail view
- `SnoozePicker` - Snooze duration selector
- `UnsubscribeOverlay` - Unsubscribe confirmation flow
- `SettingsModal` - Account management
- `ActionBadge` - Action count indicators
- `ActionButton` - Bottom action bar buttons
- `GoogleIcon` - SVG icon component

**Utility functions:**
- `getSnoozeTime()` - Calculates snooze target timestamps
- `getSnoozedEmails()` / `addSnoozedEmail()` / `clearExpiredSnoozes()` - localStorage snooze management
- `checkExpiredSnoozes()` - Server-side snooze check
- `fetchEmails()` - Client-side email fetch orchestration

**State management:** All in React useState/useEffect hooks within SwipeBox component. Action counts (archive, reply, snooze, unsubscribe) are in-memory only and reset on page refresh.

### lib/gmail.js (10KB - Gmail Backend)

**Exported functions (16):**
- `getOAuth2Client()` - Creates Google OAuth2 client
- `getAuthUrl()` - Generates OAuth consent URL
- `getTokensFromCode(code)` - Exchanges auth code for tokens
- `getEmailForTokens(tokens)` - Gets email address from token
- `getGmailClient(tokens)` - Creates authenticated Gmail client
- `parseAccountsCookie(cookieHeader)` - Reads account tokens from cookies
- `serializeAccountsCookie(accounts)` - Writes account tokens to cookies
- `getAccountTokens(cookieHeader, email)` - Gets tokens for specific account
- `sendReply(tokens, messageId, replyText)` - Sends email reply
- `markAsRead(tokens, messageId)` - Marks email as read
- `archiveEmail(tokens, messageId)` - Archives email
- `trashEmail(tokens, messageId)` - Moves email to trash
- `snoozeEmail(tokens, messageId)` - Snoozes email
- `unsnoozeEmail(tokens, messageId)` - Unsnoozes email
- `forwardEmail(tokens, messageId, to)` - Forwards email
- `removeAccount(cookieHeader, email)` - Removes account from cookie

**Internal functions (5):**
- `stripHtml(html)` - Sanitizes HTML email bodies to clean plain text
- `parseEmail(message)` - Extracts subject, from, body, preview from Gmail message
- `formatTime(dateStr)` - Formats email timestamps
- `createReplyRaw(to, subject, messageId, text)` - Builds reply MIME
- `createForwardRaw(from, to, subject, messageId, text)` - Builds forward MIME

### lib/ai.js (5KB - AI Layer)

Two exports using Claude (Anthropic SDK):
1. **Summarize emails** - Takes batch of emails, returns summaries + categories
2. **Generate reply** - Takes email context, returns draft reply text

## Data Flow

```
User opens app
  -> page.js checks for account cookies
  -> If no cookies: show LoginScreen
  -> If cookies: call GET /api/emails
     -> emails/route.js reads tokens from cookie
     -> Creates Gmail client
     -> Fetches inbox messages from Gmail API
     -> Calls parseEmail() on each (uses stripHtml internally)
     -> Calls AI summarize on the batch
     -> Returns JSON array of emails with summaries
  -> page.js renders EmailCards in a swipeable stack

User swipes a card
  -> Framer Motion detects swipe direction
  -> page.js calls POST /api/emails/action with action type
     -> action/route.js calls appropriate gmail.js function
     -> Returns success/failure
  -> page.js updates state (removes card, increments count)

User taps a card
  -> EmailModal opens with full email body
  -> Body rendered as paragraphs (split on newlines)
```

## How to Make Changes

### Current Workflow (Browser-based via GitHub API)

Due to the tools available, changes are made through:
1. Fetch file content via GitHub Contents API
2. Modify content in browser JavaScript (store in window variables)
3. Create blobs via GitHub Blobs API
4. Create tree via GitHub Trees API
5. Create commit via GitHub Commits API
6. Update ref to point to new commit
7. Vercel auto-deploys from main branch (takes ~60 seconds)

### Important Gotchas

- **Content filter blocking:** The Chrome extension blocks JavaScript output containing cookie/token patterns. Use boolean checks or numeric analysis instead of returning raw gmail.js content.
- **Template literal escaping:** When writing file content as JS template literals, `\\n` becomes `\n` (two chars: backslash + n) which is correct JS source. Be careful not to accidentally create actual newline characters in string literals.
- **OAuth token expiration:** Gmail access tokens expire after 1 hour. If the app shows "Inbox Zero" unexpectedly, the user likely needs to reconnect Gmail.
- **Error swallowing:** The email route's try/catch returns empty arrays on error. This makes debugging harder - errors look like "no emails" instead of showing error messages.
- **Single-file UI:** All 18 components are in page.js. Search carefully by component name when making changes.
- **No local dev captured:** All previous work was done via GitHub API pushes. There is no local development environment currently set up.

## Planned Improvements

1. **Split page.js into components** - Extract EmailCard, EmailModal, etc. into separate files
2. **Persist action counts** - Use localStorage or a simple DB
3. **Better error handling** - Show actual errors instead of empty inbox
4. **Add error logging** - Console.error at minimum, ideally a logging service
5. **Add tests** - At least for stripHtml, parseEmail, and API routes
6. **Set up local dev** - Enable local development with `npm run dev`

## Session Notes

### 2026-02-27 - Workflow Optimization

**Friction points identified:**
- Chrome extension content filter blocks code containing cookie/token patterns
- GitHub API calls require PAT stored in browser memory (lost on page navigation)
- No ability to clone repo in VM (network proxy blocks GitHub)
- Large file edits (page.js at 57KB) are risky via string manipulation

**Recommended approach:**
- Keep PAT in a window variable, restore after any page navigation
- Use boolean/numeric pattern checks instead of returning raw code content
- For large edits, identify exact positions (indexOf) before splicing
- Always verify Vercel build status after pushing commits
- Create a new GitHub PAT for each working session, revoke afterward
