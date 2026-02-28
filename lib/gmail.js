import { logError, logWarn } from './logger';
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

// --- HTML sanitization ---

function stripHtml(html) {
  if (!html) return "";
  let text = html;
  
  // Remove HTML comments (including partial ones like -->)
  text = text.replace(/<!--[\s\S]*?-->/gi, "");
  text = text.replace(/-->/g, "");
  text = text.replace(/<!--/g, "");
  
  // Remove style, script, head blocks entirely
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");
  
  // Remove tracking pixels and hidden images
  text = text.replace(/<img[^>]*(?:width|height)\s*=\s*["']?[01]["']?[^>]*>/gi, "");
  text = text.replace(/<img[^>]*display\s*:\s*none[^>]*>/gi, "");
  
  // Convert block elements to newlines
  text = text.replace(/<\/?(p|div|tr|li|h[1-6]|blockquote|section|article|header|footer)[^>]*>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/?(td|th)[^>]*>/gi, " ");
  text = text.replace(/<hr[^>]*>/gi, "\n");
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, "");
  
  // Decode HTML entities
  const entities = {
    "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">",
    "&quot;": '"', "&#39;": "'", "&apos;": "'",
    "&rsquo;": "'", "&lsquo;": "'", "&rdquo;": '"', "&ldquo;": '"',
    "&mdash;": " - ", "&ndash;": "-", "&hellip;": "...",
    "&bull;": " ", "&middot;": " ", "&copy;": "(c)",
    "&reg;": "(R)", "&trade;": "(TM)", "&deg;": " degrees",
    "&rarr;": "->", "&larr;": "<-", "&uarr;": "^", "&darr;": "v",
    "&ensp;": " ", "&emsp;": " ", "&thinsp;": " ",
    "&zwnj;": "", "&zwj;": "", "&lrm;": "", "&rlm;": ""
  };
  for (const [ent, rep] of Object.entries(entities)) {
    text = text.split(ent).join(rep);
  }
  // Decode numeric entities
  text = text.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
  text = text.replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
  
  // Remove standalone URLs on their own lines (tracking links, unsubscribe links, etc.)
  text = text.replace(/^\s*https?:\/\/\S+\s*$/gm, "");
  
  // Remove email forward/reply headers
  text = text.replace(/^-{2,}\s*(Forwarded|Original)\s+[Mm]essage\s*-{2,}.*$/gm, "");
  
  // Remove lines that are just separators (dashes, underscores, equals, asterisks)
  text = text.replace(/^[\s*_=\-]{4,}\s*$/gm, "");
  
  // Remove lines that are just special chars or whitespace junk
  text = text.replace(/^[\s\*\|\+\#\~]+$/gm, "");
  
  // Clean up bracket/paren junk often left from stripped HTML
  text = text.replace(/\[\s*\]/g, "");
  text = text.replace(/\(\s*\)/g, "");
  
  // Collapse multiple spaces to single space per line
  text = text.replace(/[ \t]+/g, " ");
  
  // Normalize newlines: collapse 3+ newlines to 2
  text = text.replace(/\n{3,}/g, "\n\n");
  
  // Trim each line
  text = text.split("\n").map(l => l.trim()).join("\n");
  
  // Remove leading/trailing whitespace
  text = text.trim();
  
  return text;
}


// Sanitize HTML for safe rendering — removes scripts, event handlers, and tracking but keeps formatting
function sanitizeHtml(html) {
  if (!html) return "";
  let clean = html;

  // Remove script and style tags entirely
  clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  clean = clean.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");

  // Remove event handlers (onclick, onload, onerror, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  clean = clean.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");

  // Remove javascript: URLs
  clean = clean.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

  // Remove tracking pixels (1x1 images)
  clean = clean.replace(/<img[^>]*(?:width|height)\s*=\s*["']?[01](?:px)?["']?[^>]*>/gi, "");

  // Remove form elements
  clean = clean.replace(/<\/?(?:form|input|button|select|textarea)[^>]*>/gi, "");

  // Remove iframe, object, embed
  clean = clean.replace(/<\/?(?:iframe|object|embed|applet)[^>]*>/gi, "");

  // Make all links open in new tab and add noopener
  clean = clean.replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');

  return clean;
}

// Recursively search MIME parts for a specific mimeType (handles nested multipart structures)
function findPartByMime(parts, mimeType) {
  if (!parts) return null;
  for (const part of parts) {
    if (part.mimeType === mimeType && part.body?.data) return part;
    if (part.parts) {
      const found = findPartByMime(part.parts, mimeType);
      if (found) return found;
    }
  }
  return null;
}

function parseEmail(message, accountEmail) {
  const headers = message.payload.headers;
  const getHeader = (name) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  const from = getHeader("From");
  const nameMatch = from.match(/^"?([^"<]+)"?\s*<?/);
  const emailMatch = from.match(/<([^>]+)>/);

  let body = "";
  let bodyHtml = "";

  if (message.payload.parts) {
    // Recursively find text parts (handles nested multipart/alternative structures)
    const textPart = findPartByMime(message.payload.parts, "text/plain");
    const htmlPart = findPartByMime(message.payload.parts, "text/html");

    // Prefer HTML for rich rendering, fall back to plain text
    if (htmlPart?.body?.data) {
      const rawHtml = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
      bodyHtml = sanitizeHtml(rawHtml);
      body = stripHtml(rawHtml);
    } else if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      body = body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      body = body.replace(/\n{3,}/g, "\n\n").trim();
    }
  } else if (message.payload.body?.data) {
    const raw = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
    if (raw.includes("<") && (raw.includes("</") || raw.includes("/>"))) {
      bodyHtml = sanitizeHtml(raw);
      body = stripHtml(raw);
    } else {
      body = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    }
  }

  // Fallback to Gmail snippet if body extraction failed
  if (!body && message.snippet) {
    body = message.snippet;
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
    bodyHtml: bodyHtml || "",
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

export async function snoozeEmail(tokens, emailId) {
  const gmail = getGmailClient(tokens);
  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: { removeLabelIds: ["INBOX"] },
  });
}

export async function unsnoozeEmail(tokens, emailId) {
  const gmail = getGmailClient(tokens);
  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: { addLabelIds: ["INBOX", "UNREAD"] },
  });
}

export async function undoMarkRead(tokens, emailId) {
  const gmail = getGmailClient(tokens);
  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: { addLabelIds: ["INBOX", "UNREAD"] },
  });
}

export async function untrashEmail(tokens, emailId) {
  const gmail = getGmailClient(tokens);
  await gmail.users.messages.untrash({ userId: "me", id: emailId });
  // After untrashing, put it back in inbox as unread
  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: { addLabelIds: ["INBOX", "UNREAD"] },
  });
}

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


export async function fetchAllAccountEmails(accounts) {
  const allEmails = [];

  for (const account of accounts) {
    const tokens = getAccountTokens(accounts, account.email);
    if (!tokens) continue;

    try {
      const gmail = getGmailClient(tokens);

      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 20,
        labelIds: ['INBOX', 'UNREAD'],
      });

      const messages = listResponse.data.messages || [];

      for (const msg of messages) {
        try {
          const fullMsg = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full',
          });

          const parsed = parseEmail(fullMsg.data, account.email);
          if (parsed) {
            allEmails.push(parsed);
          }
        } catch (msgErr) {
          logWarn('gmail:fetchAllAccountEmails', 'Failed to fetch message', { messageId: msg.id, error: msgErr.message });
        }
      }
    } catch (err) {
      if (err.code === 401 || err.code === 403 ||
          err.message?.includes('invalid_grant') ||
          err.message?.includes('Token has been expired') ||
          err.message?.includes('Invalid Credentials')) {
        const authError = new Error('Gmail session expired for ' + account.email);
        authError.code = 401;
        authError.isAuthError = true;
        throw authError;
      }
      logError('gmail:fetchAllAccountEmails', 'Failed to fetch emails for account', err);
    }
  }

  return allEmails;
}

export function removeAccount(accounts, emailToRemove) {
  return accounts.filter((a) => a.email !== emailToRemove);
}
