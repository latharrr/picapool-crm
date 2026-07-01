import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

// A separate, lightweight NextAuth instance (no providers, no Sheets/bcrypt
// imports) used only for the optimistic session-cookie check on every
// navigation. The full instance with the Credentials provider lives in
// src/auth.ts and only runs inside route handlers.
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
