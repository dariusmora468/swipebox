import { NextResponse } from "next/server";
import { logError } from "../../../../lib/logger";
import { cookies } from "next/headers";
import {
  parseAccountsCookie,
  getAccountTokens,
  sendReply,
  markAsRead,
  archiveEmail,
  trashEmail,
  snoozeEmail,
  unsnoozeEmail,
  forwardEmail,
} from "../../../../lib/gmail";

export async function POST(request) {
  const cookieStore = cookies();
  const accountsCookie = cookieStore.get("swipebox_accounts");

  if (!accountsCookie) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const accounts = parseAccountsCookie(accountsCookie.value);

  try {
    const { action, email, replyText, forwardTo, snoozeIds } = await request.json();

    // Batch unsnooze: re-add multiple emails to inbox
    if (action === "unsnooze_batch" && snoozeIds) {
      const results = await Promise.allSettled(
        snoozeIds.map(async ({ emailId, account }) => {
          const tokens = getAccountTokens(accounts, account);
          if (tokens) await unsnoozeEmail(tokens, emailId);
        })
      );
      return NextResponse.json({
        success: true,
        action: "unsnooze_batch",
        count: results.filter((r) => r.status === "fulfilled").length,
      });
    }

    // Route to the correct account
    const tokens = getAccountTokens(accounts, email.account);
    if (!tokens) {
      return NextResponse.json(
        { error: "account_not_found", details: `No tokens for ${email.account}` },
        { status: 400 }
      );
    }

    switch (action) {
      case "send":
        if (!replyText) {
          // No reply text: just mark as read + archive (done)
          await markAsRead(tokens, email.id);
          await archiveEmail(tokens, email.id);
        } else {
          await sendReply(tokens, email, replyText);
          await archiveEmail(tokens, email.id);
        }
        break;

      case "mark_read":
        await markAsRead(tokens, email.id);
        break;

      case "archive":
        await archiveEmail(tokens, email.id);
        break;

      case "delete":
        await trashEmail(tokens, email.id);
        break;

      case "unsubscribe":
        // Mark as read (the actual unsubscribe is handled by /api/emails/unsubscribe)
        await markAsRead(tokens, email.id);
        break;

      case "snooze":
        await snoozeEmail(tokens, email.id);
        break;

      case "unsnooze":
        await unsnoozeEmail(tokens, email.id);
        break;

      case "forward":
        if (!forwardTo) {
          return NextResponse.json({ error: "no_forward_address" }, { status: 400 });
        }
        await forwardEmail(tokens, email, forwardTo);
        break;

      default:
        return NextResponse.json({ error: "invalid_action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, action });
  } catch (err) {
    logError('api:emails:action', 'Email action failed', err);
    return NextResponse.json(
      { error: "action_failed", details: err.message },
      { status: 500 }
    );
  }
}
