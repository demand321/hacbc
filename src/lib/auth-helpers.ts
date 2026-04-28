import { getServerSession, type Session } from "next-auth";
import { authOptions } from "./auth";

export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export async function requireSession(): Promise<Session | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return session;
}

export async function requireApproved(): Promise<Session | null> {
  const session = await requireSession();
  if (!session) return null;
  if (session.user.memberStatus !== "APPROVED") return null;
  return session;
}

export async function requireAdmin(): Promise<Session | null> {
  const session = await requireSession();
  if (!session) return null;
  if (session.user.role !== "ADMIN") return null;
  return session;
}

export const MAX_NAME_LENGTH = 100;
export const MAX_PHONE_LENGTH = 30;
export const MAX_COMMENT_LENGTH = 2000;
export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_CAPTION_LENGTH = 500;
