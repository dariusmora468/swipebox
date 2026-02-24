import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  parseAccountsCookie,
  getAccountTokens,
  sendReply,
  archiveEmail,
  trashEmail,
  snoozeEmail,
} from "../../../../lib/gmail";

export async function POST(request) {
  const cookieStore = cookies();
  const accountsCookie = cookieStore.get("swipebox_accounts");

  if (!accountsCookie) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const accounts = parseAccountsCookie(accountsCookie.value);

  try {
    const { action, email, replyText } = await request.json();
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
          return NextResponse.json({ error: "no_reply_text" }, { status: 400 });
        }
        await sendReply(tokens, email, replyText);
        await archiveEmail(tokens, email.id);
        break;
      case "archive":
        await archiveEmail(tokens, email.id);
        break;
      case "delete":
        await trashEmail(tokens, email.id);
        break;
      case "snooze":
        await snoozeEmail(tokens, email.id);
        break;
      default:
        return NextResponse.json({ error: "invalid_action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, action });
  } catch (err) {
    console.error("Action error:", err);
    return NextResponse.json(
      { error: "action_failed", details: err.message },
      { status: 500 }
    );
  }
}
