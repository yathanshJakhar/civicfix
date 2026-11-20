import { NextResponse, type NextRequest } from "next/server";

// Matches COOKIE in lib/session.ts.
const SESSION_COOKIE = "civicfix_session";

/**
 * Every page needs a signed-in account; anyone without a session cookie goes to /login.
 * Only an optimistic cookie check: pages and APIs still verify the session and role themselves.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/", "/tickets/:path*", "/report/:path*", "/map/:path*", "/issue/:path*", "/authority/:path*", "/contractor/:path*", "/admin/:path*", "/account/:path*"],
};
