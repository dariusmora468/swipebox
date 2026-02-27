import { NextResponse } from "next/server";
import { logError } from "../../../../lib/logger";
import { cookies } from "next/headers";
import { parseAccountsCookie, serializeAccountsCookie } from "../../../../../lib/gmail";

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const cookieStore = cookies();
    const accountsCookie = cookieStore.get("gmail_accounts");

    if (!accountsCookie?.value) {
      return NextResponse.json({ error: "No accounts found" }, { status: 404 });
    }

    const accounts = parseAccountsCookie(accountsCookie.value);
    const filtered = accounts.filter((a) => a.email !== email);

    if (filtered.length === accounts.length) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, remaining: filtered.length });

    if (filtered.length === 0) {
      response.cookies.delete("gmail_accounts");
    } else {
      response.cookies.set("gmail_accounts", serializeAccountsCookie(filtered), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    logError('api:auth:remove', 'Failed to remove account', error);
    return NextResponse.json({ error: "Failed to remove account" }, { status: 500 });
  }
}
