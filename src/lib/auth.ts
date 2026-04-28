import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === "production") {
  if (!NEXTAUTH_SECRET || NEXTAUTH_SECRET.length < 32) {
    throw new Error(
      "NEXTAUTH_SECRET must be set to a strong random value (>=32 chars) in production"
    );
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Passord", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          memberStatus: user.memberStatus,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.memberStatus = user.memberStatus;
        token.mustChangePassword = user.mustChangePassword;
        token.refreshedAt = Date.now();
      }
      const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
      const lastRefresh = (token.refreshedAt as number | undefined) ?? 0;
      const stale = Date.now() - lastRefresh > REFRESH_INTERVAL_MS;
      if ((trigger === "update" || stale) && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, memberStatus: true, mustChangePassword: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.memberStatus = dbUser.memberStatus;
          token.mustChangePassword = dbUser.mustChangePassword;
          token.refreshedAt = Date.now();
        } else {
          // User deleted — invalidate token by clearing identifiers
          token.sub = undefined;
          token.role = "";
          token.memberStatus = "";
          token.mustChangePassword = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.memberStatus = token.memberStatus as string;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/logg-inn",
    error: "/logg-inn",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60, // refresh JWT every hour
  },
  secret: NEXTAUTH_SECRET,
};
