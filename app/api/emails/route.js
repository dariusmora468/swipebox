import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { parseAccountsCookie, fetchAllAccountEmails } from "../../../lib/gmail";
import { processEmails } from "../../../lib/ai";

export async function GET() {
  const cookieStore = cookies();
  const accountsCookie = cookieStore.get("swipebox_accounts");

  if (!accountsCookie) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const accounts = parseAccountsCookie(accountsCookie.value);

  if (accounts.length === 0) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
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

    const processed = await processEmails(emails);

    return NextResponse.json({
      emails: processed,
      accounts: accounts.map((a) => ({ email: a.email, name: a.name })),
    });
  } catch (err) {
    console.error("Fetch emails error:", err);
    if (err.message?.includes("invalid_grant")) {
      return NextResponse.json({ error: "token_expired" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "fetch_failed", details: err.message },
      { status: 500 }
    );
  }
}
