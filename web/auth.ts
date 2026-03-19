/**
 * Phase 1 — NextAuth config.
 * Move 1: Minimal sign-in with Credentials (no DB yet). Accept any email + password "password" for testing.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

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
        // Move 1: Test only — accept any email if password is "password". No DB yet.
        if (!credentials?.email || typeof credentials.email !== "string") return null;
        const password = credentials.password;
        if (password !== "password") return null;
        return {
          id: "temp-1",
          email: credentials.email,
          name: credentials.email.split("@")[0],
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = "USER"; // Move 1: hardcoded; we'll use DB role in a later move
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
