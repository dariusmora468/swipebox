# SwipeBox Pre-Push Checklist

Run through this before every deploy or push that touches swipe actions, email fetching, or Gmail helpers.

---

## 1. Run the test suite

```bash
cd ~/swipebox && node tests/core-actions.test.js
```

All tests must pass (0 failures). Warnings should be reviewed manually.

---

## 2. Quick manual smoke test

Open the app on your phone and verify:

- [ ] Swipe LEFT on an email → it disappears and does NOT come back on refresh
- [ ] Swipe RIGHT on an email → it disappears and does NOT come back on refresh
- [ ] Swipe DOWN (unsubscribe) → email disappears and does NOT come back
- [ ] Swipe UP (snooze) → email disappears, snooze picker works
- [ ] Open an email → Reply button works, Forward button works
- [ ] Halfway celebration fires when you clear ~50% of emails

---

## 3. Core contract reminder

The fetch query is:

```
labelIds: ['INBOX', 'UNREAD']
```

This means **every action must remove INBOX, UNREAD, or both** to prevent the email from reappearing. If you add a new action, make sure it calls at least one of:

- `markAsRead()` — removes UNREAD
- `archiveEmail()` — removes INBOX
- `snoozeEmail()` — removes INBOX
- `trashEmail()` — moves to trash (removes from INBOX)

---

## 4. Files to watch

If you change any of these files, re-run the test suite:

- `lib/gmail.js` — fetch query and Gmail helper functions
- `app/api/emails/action/route.js` — action routing (switch/case)
- `app/page.js` — swipe direction → action mapping

---

## 5. Push commands

```bash
cd ~/swipebox
git add -A
git commit -m "your message here"
git push
```

Vercel will auto-deploy from the push. Check https://swipebox-six.vercel.app after a minute or two.
