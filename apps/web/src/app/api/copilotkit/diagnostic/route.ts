import { NextRequest, NextResponse } from "next/server";

/**
 * Quick diagnostic: call this from browser while logged in to see
 * whether cookies reach the Next.js copilot route. Returns JSON with
 * cookie details + model resolution result.
 */
export const GET = async (req: NextRequest) => {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const orgId = req.cookies.get("jamot_active_org")?.value;
  const hasSession = /(^|;\s*)jamot_session=/.test(cookieHeader);

  return NextResponse.json({
    note: "Paste this URL in browser while logged in to diagnose copilot failures",
    cookiesReceived: {
      jamot_active_org: orgId ?? "(unset)",
      has_jamot_session: hasSession,
      raw_cookie_header_length: cookieHeader.length,
    },
    api_url: process.env.NEXT_PUBLIC_API_URL ?? "(unset)",
  });
};
