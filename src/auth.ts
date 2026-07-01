import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth/auth.config";
import {
  usersRepository,
  userWorkspacesRepository,
  workspacesRepository,
} from "@/lib/sheets/repositories";
import { getRootSpreadsheetId } from "@/lib/env";
import { SheetsNotConfiguredError } from "@/lib/sheets/errors";
import type { Role } from "@/lib/sheets/schema/common";

export interface SessionWorkspace {
  id: string;
  name: string;
  role: Role;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      workspaces: SessionWorkspace[];
    };
  }

  interface User {
    id: string;
    role: Role;
    workspaces: SessionWorkspace[];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid: string;
    role: Role;
    workspaces: SessionWorkspace[];
  }
}

async function authorize(credentials: Partial<Record<"email" | "password", unknown>>) {
  const email = typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
  const password = typeof credentials.password === "string" ? credentials.password : "";
  if (!email || !password) return null;

  const rootId = getRootSpreadsheetId();
  if (!rootId) return null;

  try {
    const users = await usersRepository.list(rootId);
    const user = users.find((u) => u.email.toLowerCase() === email && u.is_active);
    if (!user) return null;

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) return null;

    const [memberships, workspaces] = await Promise.all([
      userWorkspacesRepository.list(rootId),
      workspacesRepository.list(rootId),
    ]);

    const sessionWorkspaces: SessionWorkspace[] = memberships
      .filter((m) => m.user_id === user.id)
      .map((m) => ({
        id: m.workspace_id,
        name: workspaces.find((w) => w.id === m.workspace_id)?.name ?? "Unknown workspace",
        role: m.role,
      }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.default_role,
      workspaces: sessionWorkspaces,
    };
  } catch (err) {
    if (err instanceof SheetsNotConfiguredError) return null;
    throw err;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.workspaces = user.workspaces;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid;
      session.user.role = token.role;
      session.user.workspaces = token.workspaces;
      return session;
    },
  },
});
