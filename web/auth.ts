/**
 * Phase 1 — NextAuth config.
 * Move 2: Sign-in uses the database — look up User by email, verify password hash, put role in session.
 */
import bcrypt from "bcrypt";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getPrisma } from "@/lib/db";

// So we can use role in session (Phase 1)
declare module "next-auth" {
  interface Session {
    user: { id: string; email?: string | null; name?: string | null; role?: string };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || typeof credentials.email !== "string") return null;
        const password = credentials.password;
        if (typeof password !== "string" || !password) return null;

        try {
          const prisma = getPrisma();
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.trim().toLowerCase() },
          });
          if (!user || !user.passwordHash) return null;
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.displayName ?? user.email.split("@")[0],
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
      }
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
});
