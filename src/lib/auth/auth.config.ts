import type { NextAuthConfig } from "next-auth";

/**
 * Edge/proxy-safe subset of the NextAuth config: no providers, no Sheets or
 * bcrypt imports. `src/proxy.ts` uses this (via its own lightweight
 * NextAuth() instance) to redirect based on the session cookie alone —
 * fast, and it never touches Google Sheets on every navigation. The full
 * config with the Credentials provider lives in `src/auth.ts` and only runs
 * inside route handlers / server actions.
 */
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const isLoginPage = request.nextUrl.pathname === "/login";

      if (isLoginPage) {
        return isLoggedIn ? Response.redirect(new URL("/dashboard", request.nextUrl)) : true;
      }
      return isLoggedIn;
    },
  },
};
