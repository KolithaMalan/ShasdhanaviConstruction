import type { NextAuthConfig } from "next-auth";
import { roleToDashboard } from "@/config/roles";
import type { Role } from "@/types";

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
