import { google } from "googleapis";

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
  );
}

export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  });
}

export async function getTokensFromCode(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getEmailForTokens(tokens) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return { email: data.email, name: data.name || data.email };
}

export function getGmailClient(tokens) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: "v1", auth: oauth2Client });
}

// --- Multi-account helpers ---

export function parseAccountsCookie(cookieValue) {
  if (!cookieValue) return [];
  try {
    return JSON.parse(Buffer.from(cookieValue, "base64").toString("utf-8"));
  } catch {
    return [];
  }
}

export function serializeAccountsCookie(accounts) {
  return Buffer.from(JSON.stringify(accounts)).toString("base64");
}

export function getAccountTokens(accounts, email) {
  const account = accounts.find((a) => a.email === email);
  return account ? account.tokens : null;
}

// --- Email fetching ---

export async function fetchUnreadEmails(tokens, accountEmail, maxResults = 15) {
  const gmail = getGmailClient(tokens);

  const res = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread in:inbox",
    maxResults,
  });

  if (!res.data.messages || res.data.messages.length === 0) return [];

  const emails = await Promise.all(
    res.data.messages.map(async (msg) => {
      const full = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });
      return parseEmail(full.data, accountEmail);
    })
  );

  return emails;
}

export async function fetchAllAccountEmails(accounts) {
  const allEmails = await Promise.all(
    accounts.map((account) =>
      fetchUnreadEmails(account.tokens, account.email).catch((err) => {
        console.error(`Error fetching from ${account.email}:`, err);
        return [];
      })
    )
  );

  return allEmails
    .flat()
    .sort((a, b) => b.timestamp - a.timestamp);
}

function parseEmail(message, accountEmail) {
  const headers = message.payload.headers;
  const getHeader = (name) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  const from = getHeader("From");
  const nameMatch = from.match(/^"?([^"<]+)"?\s*<?/);
  const emailMatch = from.match(/<([^>]+)>/);

  let body = "";
  if (message.payload.parts) {
    const textPart = message.payload.parts.find(
      (p) => p.mimeType === "text/plain"
    );
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
    } else {
      const htmlPart = message.payload.parts.find(
        (p) => p.mimeType === "text/html"
      );
      if (htmlPart?.body?.data) {
        body = Buffer.from(htmlPart.body.data, "base64")
          .toString("utf-8")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }
    }
  } else if (message.payload.body?.data) {
    body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
  }

  if (body.length > 2000) body = body.substring(0, 2000) + "...";

  const initials = (nameMatch?.[1] || "?")
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return {
    id: message.id,
    threadId: message.threadId,
    from: nameMatch?.[1]?.trim() || from,
    email: emailMatch?.[1] || from,
    subject: getHeader("Subject") || "(no subject)",
    body,
    preview: body.substring(0, 250) + (body.length > 250 ? "..." : ""),
    time: formatTime(parseInt(message.internalDate)),
    timestamp: parseInt(message.internalDate),
    avatar: initials,
    labelIds: message.labelIds || [],
    account: accountEmail,
  };
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// --- Actions ---

export async function sendReply(tokens, email, replyText) {
  const gmail = getGmailClient(tokens);
  const raw = createReplyRaw(email, replyText);
  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw, threadId: email.threadId },
  });
  // Also mark as read after sending
  await markAsRead(tokens, email.id);
}

function createReplyRaw(email, replyText) {
  const message = [
    `To: ${email.email}`,
    `Subject: Re: ${email.subject}`,
    `In-Reply-To: ${email.id}`,
    `References: ${email.id}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    replyText,
  ].join("\r\n");

  return Buffer.from(message).toString("base64url");
}

// Mark as read — removes UNREAD label, email stays in inbox
export async function markAsRead(tokens, emailId) {
  const gmail = getGmailClient(tokens);
  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: { removeLabelIds: ["UNREAD"] },
  });
}

export async function archiveEmail(tokens, emailId) {
  const gmail = getGmailClient(tokens);
  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: { removeLabelIds: ["INBOX"] },
  });
}

export async function trashEmail(tokens, emailId) {
  const gmail = getGmailClient(tokens);
  await gmail.users.messages.trash({ userId: "me", id: emailId });
}

// Real snooze: archive (remove from INBOX) but keep UNREAD so it resurfaces
export async function snoozeEmail(tokens, emailId) {
  const gmail = getGmailClient(tokens);
  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: { removeLabelIds: ["INBOX"] },
    // Keep UNREAD so when we re-add INBOX it shows as unread
  });
}

// Unsnooze: re-add to INBOX (for snoozed emails whose time has expired)
export async function unsnoozeEmail(tokens, emailId) {
  const gmail = getGmailClient(tokens);
  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: { addLabelIds: ["INBOX", "UNREAD"] },
  });
}

// Forward an email
export async function forwardEmail(tokens, email, forwardTo) {
  const gmail = getGmailClient(tokens);
  const raw = createForwardRaw(email, forwardTo);
  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}

function createForwardRaw(email, forwardTo) {
  const body = email.body || email.preview || "";
  const message = [
    `To: ${forwardTo}`,
    `Subject: Fwd: ${email.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    `---------- Forwarded message ----------`,
    `From: ${email.from} <${email.email}>`,
    `Subject: ${email.subject}`,
    ``,
    body,
  ].join("\r\n");

  return Buffer.from(message).toString("base64url");
}

// Remove an account from the cookie
export function removeAccount(accounts, emailToRemove) {
  return accounts.filter((a) => a.email !== emailToRemove);
}
