import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { parseAccountsCookie, fetchAllAccountEmails } from "../../../lib/gmail";
import { processEmails } from "../../../lib/ai";

export async function GET(request) {
  const cookieStore = cookies();
  const accountsCookie = cookieStore.get("swipebox_accounts");

  if (!accountsCookie) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const accounts = parseAccountsCookie(accountsCookie.value);
  if (accounts.length === 0) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  // Get unsubscribed senders from cookie
  const unsubCookie = cookieStore.get("swipebox_unsubscribed");
  let unsubscribedSenders = [];
  if (unsubCookie) {
    try {
      unsubscribedSenders = JSON.parse(
        Buffer.from(unsubCookie.value, "base64").toString("utf-8")
      );
    } catch {
      unsubscribedSenders = [];
    }
  }

  try {
    const emails = await fetchAllAccountEmails(accounts);

    if (emails.length === 0) {
      return NextResponse.json({
        emails: [],
        accounts: accounts.map((a) => ({ email: a.email, name: a.name })),
        message: "inbox_zero",
      });
    }

    // Flag emails from previously unsubscribed senders
    const flaggedEmails = emails.map((email) => ({
      ...email,
      previouslyUnsubscribed: unsubscribedSenders.some(
        (s) => s.email.toLowerCase() === email.email.toLowerCase()
      ),
    }));

    const processed = await processEmails(flaggedEmails);

    return NextResponse.json({
      emails: processed,
      accounts: accounts.map((a) => ({ email: a.email, name: a.name })),
    });
  } catch (err) {
    console.error("Fetch emails error:", err);
    if (err.isAuthError || err.code === 401 || err.message?.includes('invalid_grant')) {
      return NextResponse.json({ error: "token_expired" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "fetch_failed", details: err.message },
      { status: 500 }
    );
  }
}
