import type { NextAuthConfig } from "next-auth";
import { roleToDashboard } from "@/config/roles";
import type { Role } from "@/types";

/**
 * Screens every signed-in role may reach regardless of its dashboard prefix —
 * they appear in several roles' sidebars (or in the user menu / notification
 * dropdown), so the per-role prefix rule below must not redirect away from
 * them. The data behind each one is still guarded by `requireRole` in its API.
 */
const SHARED_AUTHENTICATED_PATHS = ["/profile", "/notifications", "/permanent-movements"];

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours
  },
  providers: [], // populated in lib/auth.ts (Node runtime)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const isPublic =
        path === "/" ||
        path.startsWith("/login") ||
        path.startsWith("/verify-code") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/contractor-registration") ||
        path === "/api/contractor-registration" ||
        path.startsWith("/api/public/") ||
        path.startsWith("/api/photos/");

      if (isPublic) return true;

      if (!isLoggedIn) {
        const loginUrl = new URL("/", nextUrl);
        loginUrl.searchParams.set("redirect", path);
        return Response.redirect(loginUrl);
      }

      if (
        SHARED_AUTHENTICATED_PATHS.some(
          (p) => path === p || path.startsWith(`${p}/`),
        )
      ) {
        return true;
      }

      const role = auth.user.role as Role | undefined;
      if (role) {
        const allowedPrefix = roleToDashboard[role];
        if (allowedPrefix && !path.startsWith(allowedPrefix)) {
          return Response.redirect(new URL(allowedPrefix, nextUrl));
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: Role }).role as Role;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  trustHost: true,
};
