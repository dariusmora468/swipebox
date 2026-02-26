import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  parseAccountsCookie,
  getAccountTokens,
  getGmailClient,
  markAsRead,
} from "../../../../lib/gmail";

export async function POST(request) {
  const cookieStore = cookies();
  const accountsCookie = cookieStore.get("swipebox_accounts");

  if (!accountsCookie) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const accounts = parseAccountsCookie(accountsCookie.value);

  try {
    const { messageId, accountEmail } = await request.json();

    const tokens = getAccountTokens(accounts, accountEmail);
    if (!tokens) {
      return NextResponse.json(
        { error: "account_not_found", details: `No tokens for ${accountEmail}` },
        { status: 400 }
      );
    }

    const gmail = getGmailClient(tokens);

    // Fetch the full message to get headers
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const headers = msg.data.payload.headers;
    const getHeader = (name) =>
      headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

    const listUnsubscribe = getHeader("List-Unsubscribe");
    const listUnsubscribePost = getHeader("List-Unsubscribe-Post");

    // Extract sender email for tracking
    const fromHeader = getHeader("From");
    const senderMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
    const senderEmail = senderMatch[1] || fromHeader;

    let method = "none";
    let unsubscribeUrl = null;

    // Check for one-click unsubscribe (RFC 8058)
    if (
      listUnsubscribePost &&
      listUnsubscribePost.includes("List-Unsubscribe=One-Click") &&
      listUnsubscribe
    ) {
      // Extract HTTPS URL from List-Unsubscribe header
      const httpsMatch = listUnsubscribe.match(/<(https?:\/\/[^>]+)>/);
      if (httpsMatch) {
        method = "one-click";
        unsubscribeUrl = httpsMatch[1];

        // Execute the one-click unsubscribe
        try {
          await fetch(unsubscribeUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "List-Unsubscribe=One-Click",
          });
        } catch (err) {
          // One-click failed, fall back to link
          console.error("One-click unsubscribe failed:", err);
          method = "link";
        }
      }
    }

    // If no one-click, try to find an unsubscribe link
    if (method === "none" || method === "link") {
      // Check List-Unsubscribe header for HTTPS URL
      if (listUnsubscribe) {
        const httpsMatch = listUnsubscribe.match(/<(https?:\/\/[^>]+)>/);
        if (httpsMatch) {
          method = "link";
          unsubscribeUrl = httpsMatch[1];
        }
      }

      // If still no URL, scan the email body for unsubscribe links
      if (!unsubscribeUrl) {
        const body = extractEmailBody(msg.data.payload);
        if (body) {
          const unsubLink = findUnsubscribeLink(body);
          if (unsubLink) {
            method = "link";
            unsubscribeUrl = unsubLink;
          }
        }
      }
    }

    // Mark the email as read regardless
    await markAsRead(tokens, messageId);

    return NextResponse.json({
      success: true,
      method, // "one-click", "link", or "none"
      unsubscribeUrl, // URL for the overlay (if method === "link")
      senderEmail,
    });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json(
      { error: "unsubscribe_failed", details: err.message },
      { status: 500 }
    );
  }
}

// Extract text/html body from email payload
function extractEmailBody(payload) {
  if (payload.parts) {
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      return Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
    }
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      return Buffer.from(textPart.body.data, "base64").toString("utf-8");
    }
  } else if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }
  return null;
}

// Find unsubscribe link in email HTML body
function findUnsubscribeLink(html) {
  const patterns = [
    /href=["'](https?:\/\/[^"']*unsubscribe[^"']*)/i,
    /href=["'](https?:\/\/[^"']*opt[-_]?out[^"']*)/i,
    /href=["'](https?:\/\/[^"']*manage[-_]?preferences[^"']*)/i,
    /href=["'](https?:\/\/[^"']*email[-_]?preferences[^"']*)/i,
    /href=["'](https?:\/\/[^"']*remove[^"']*)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}
