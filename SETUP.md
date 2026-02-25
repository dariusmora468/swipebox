# SwipeBox — Setup Guide

Follow these 4 steps to get SwipeBox running on your phone with your real Gmail.

---

## Step 1: Get a Claude API Key (2 min)

1. Go to **https://console.anthropic.com**
2. Sign up or log in
3. Click **API Keys** in the sidebar
4. Click **Create Key**, name it "SwipeBox"
5. Copy the key — it starts with `sk-ant-...`
6. Save it somewhere (you'll need it in Step 3)

> You'll need to add a payment method. Claude Sonnet costs roughly $0.003 per email processed — so 100 emails ≈ $0.30.

---

## Step 2: Set Up Google Cloud for Gmail Access (10 min)

This is the longest step, but you only do it once.

### Create a Google Cloud Project
1. Go to **https://console.cloud.google.com**
2. Click the project dropdown at the top → **New Project**
3. Name it "SwipeBox" → Click **Create**
4. Make sure "SwipeBox" is selected as the active project

### Enable the Gmail API
1. In the search bar at the top, type **"Gmail API"**
2. Click on **Gmail API** in the results
3. Click the blue **Enable** button

### Set Up OAuth Consent Screen
1. Go to **APIs & Services → OAuth consent screen** (left sidebar)
2. Choose **External** → Click **Create**
3. Fill in:
   - App name: **SwipeBox**
   - User support email: **your email**
   - Developer email: **your email**
4. Click **Save and Continue** through the rest (skip optional fields)
5. On the **Test users** page, click **Add Users** → add your Gmail address
6. Click **Save and Continue** → **Back to Dashboard**

### Create OAuth Credentials
1. Go to **APIs & Services → Credentials** (left sidebar)
2. Click **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: **SwipeBox**
5. Under **Authorized redirect URIs**, click **+ Add URI** and enter:
   ```
   http://localhost:3000/api/auth/gmail/callback
   ```
6. Click **Create**
7. You'll see a **Client ID** and **Client Secret** — copy both and save them

---

## Step 3: Deploy to Vercel (5 min)

### Push code to GitHub
1. Go to **https://github.com/new** and create a new repository called `swipebox`
2. Upload all the files from the `swipebox` folder to this repo
   - You can drag-and-drop files on GitHub, or use GitHub Desktop

### Deploy on Vercel
1. Go to **https://vercel.com** and sign up with your GitHub account
2. Click **Add New → Project**
3. Find and import your `swipebox` repository
4. Before clicking Deploy, click **Environment Variables** and add these three:

   | Name | Value |
   |------|-------|
   | `GOOGLE_CLIENT_ID` | The Client ID from Step 2 |
   | `GOOGLE_CLIENT_SECRET` | The Client Secret from Step 2 |
   | `ANTHROPIC_API_KEY` | The API key from Step 1 |
   | `NEXT_PUBLIC_APP_URL` | Leave blank for now |

5. Click **Deploy** and wait for it to finish
6. Vercel will give you a URL like `https://swipebox-abc123.vercel.app`

### Update the redirect URI
1. Copy your Vercel URL
2. Go back to Vercel → Settings → Environment Variables
3. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g., `https://swipebox-abc123.vercel.app`)
4. Redeploy (Deployments tab → click the 3 dots → Redeploy)
5. Go back to **Google Cloud Console → Credentials → your OAuth client**
6. Add a second Authorized redirect URI:
   ```
   https://your-vercel-url.vercel.app/api/auth/gmail/callback
   ```
7. Click **Save**

---

## Step 4: Open on Your Phone (1 min)

1. Open your Vercel URL on your phone's browser
2. Tap **Connect Gmail**
3. Sign in with your Google account and grant permissions
4. SwipeBox will load your unread emails with AI-drafted replies
5. Start swiping!

### Add to Home Screen (iPhone)
1. In Safari, tap the **Share** button (square with arrow)
2. Tap **Add to Home Screen**
3. It'll look and feel like a native app

### Add to Home Screen (Android)
1. In Chrome, tap the **3 dots** menu
2. Tap **Add to Home Screen**

---

## Swipe Actions

| Direction | Action |
|-----------|--------|
| → Right | Send the AI reply |
| ← Left | Archive the email |
| ↑ Up | Snooze (archives for now) |
| ↓ Down | Delete (moves to trash) |

---

## Troubleshooting

**"Access blocked" when connecting Gmail**
→ Your app is in test mode. Make sure your Gmail is added as a test user in Google Cloud Console → OAuth consent screen → Test users.

**Emails not loading**
→ Check that the Gmail API is enabled and your OAuth credentials are correct.

**AI replies are empty**
→ Check your Anthropic API key is valid and has credits.

---

## Cost Estimate

- **Vercel**: Free (hobby plan)
- **Google Cloud**: Free (Gmail API has generous free tier)
- **Claude API**: ~$0.003 per email → $0.30 per 100 emails
