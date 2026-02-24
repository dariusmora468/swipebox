import { NextResponse } from "next/server";
import {
  getTokensFromCode,
  getEmailForTokens,
  parseAccountsCookie,
  serializeAccountsCookie,
} from "../../../../../lib/gmail";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=no_code`
    );
  }

  try {
    const tokens = await getTokensFromCode(code);
    const { email, name } = await getEmailForTokens(tokens);
    const cookieStore = request.cookies || {};
    const existingCookie = cookieStore.get?.("swipebox_accounts")?.value || null;
    const accounts = parseAccountsCookie(existingCookie);

    const existingIndex = accounts.findIndex((a) => a.email === email);
    if (existingIndex >= 0) {
      accounts[existingIndex] = { email, name, tokens };
    } else {
      accounts.push({ email, name, tokens });
    }

    const response = NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL);
    response.cookies.set("swipebox_accounts", serializeAccountsCookie(accounts), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?error=auth_failed`
    );
  }
}
