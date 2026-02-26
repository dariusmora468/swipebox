import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  parseAccountsCookie,
  serializeAccountsCookie,
  removeAccount,
} from "../../../../lib/gmail";

export async function POST(request) {
  const cookieStore = cookies();
  const accountsCookie = cookieStore.get("swipebox_accounts");

  if (!accountsCookie) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  try {
    const { email } = await request.json();
    const accounts = parseAccountsCookie(accountsCookie.value);
    const updated = removeAccount(accounts, email);

    if (updated.length === 0) {
      // Last account removed, clear cookie
      const response = NextResponse.json({ success: true, action: "logged_out" });
      response.cookies.delete("swipebox_accounts");
      return response;
    }

    const response = NextResponse.json({ success: true, remaining: updated.length });
    response.cookies.set("swipebox_accounts", serializeAccountsCookie(updated), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Remove account error:", err);
    return NextResponse.json(
      { error: "remove_failed", details: err.message },
      { status: 500 }
    );
  }
}
