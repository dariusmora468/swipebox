import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const WAITLIST_FILE = path.join(process.cwd(), 'data', 'waitlist.json');
const NOTIFY_EMAIL = 'hello@dariusmora.com';

function ensureDataDir() {
  const dir = path.dirname(WAITLIST_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getWaitlist() {
  ensureDataDir();
  if (!fs.existsSync(WAITLIST_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveWaitlist(list) {
  ensureDataDir();
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify(list, null, 2));
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const waitlist = getWaitlist();

    // Check for duplicates
    if (waitlist.some(entry => entry.email === normalizedEmail)) {
      return NextResponse.json({ message: "You're already on the list! We'll be in touch soon." });
    }

    // Add to waitlist
    const entry = {
      email: normalizedEmail,
      joinedAt: new Date().toISOString(),
      source: 'landing_page',
    };
    waitlist.push(entry);
    saveWaitlist(waitlist);

    // Send notification email to Darius via a simple fetch to a mail API
    // Using the app's own Gmail API to send a notification
    try {
      await sendNotificationEmail(normalizedEmail, waitlist.length);
    } catch (err) {
      console.error('Failed to send notification email:', err);
      // Don't fail the waitlist signup if notification fails
    }

    return NextResponse.json({
      message: "You're on the list! We'll let you know when it's your turn.",
      position: waitlist.length,
    });
  } catch (err) {
    console.error('Waitlist error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

export async function GET() {
  // Admin endpoint — returns waitlist count (no emails exposed)
  const waitlist = getWaitlist();
  return NextResponse.json({ count: waitlist.length });
}

async function sendNotificationEmail(subscriberEmail, totalCount) {
  // Try to use the Gmail API to send notification to Darius
  // This uses the app's existing auth cookies to send via the first connected account
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const accountsCookie = cookieStore.get('gmail_accounts');

  if (!accountsCookie) {
    console.log(`[Waitlist] New subscriber: ${subscriberEmail} (total: ${totalCount}) — no Gmail account to send notification`);
    return;
  }

  try {
    const accounts = JSON.parse(decodeURIComponent(accountsCookie.value));
    if (!accounts || accounts.length === 0) return;

    // Import Gmail helper
    const { google } = await import('googleapis');
    const account = accounts[0];
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/gmail/callback'
    );
    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const message = [
      `To: ${NOTIFY_EMAIL}`,
      `From: ${account.email}`,
      `Subject: [SwipeBox] New Waitlist Signup #${totalCount}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      `New waitlist signup!`,
      ``,
      `Email: ${subscriberEmail}`,
      `Position: #${totalCount}`,
      `Time: ${new Date().toLocaleString()}`,
      ``,
      `— SwipeBox Waitlist Bot`,
    ].join('\r\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    console.log(`[Waitlist] Notification sent for: ${subscriberEmail}`);
  } catch (err) {
    // Log but don't throw — signup should still succeed
    console.log(`[Waitlist] New subscriber: ${subscriberEmail} (total: ${totalCount}) — notification email failed: ${err.message}`);
  }
}
