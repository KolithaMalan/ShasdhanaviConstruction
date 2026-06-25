import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

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
