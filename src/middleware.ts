import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * The `authorized` callback in auth.config.ts still runs first and short-circuits
 * with its redirect when access is denied; this wrapper only runs afterwards, for
 * requests that are already allowed through.
 *
 * It forwards the request path as `x-pathname` because server components have no
 * way to read the current pathname, and the dashboard layout needs it to enforce
 * the Super Admin's per-role feature switches.
 */
export default auth((req) => {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
});

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - api routes
     * - _next/static, _next/image
     * - favicon, public assets
     * - the welcome page "/" and /login
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logo.svg|Sahas.png|login|contractor-registration|$).*)",
  ],
};
