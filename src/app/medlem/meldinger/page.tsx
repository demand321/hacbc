import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Mail, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  // Get all messages involving this user, ordered by most recent
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      receiver: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  // Group by the other user
  const conversationMap = new Map<
    string,
    {
      otherUser: { id: string; name: string; avatarUrl: string | null };
      lastMessage: string;
      lastMessageAt: Date;
      unreadCount: number;
    }
  >();

  for (const msg of messages) {
    const otherUser =
      msg.senderId === userId
        ? msg.receiver
        : msg.sender;

    if (!conversationMap.has(otherUser.id)) {
      conversationMap.set(otherUser.id, {
        otherUser,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        unreadCount: 0,
      });
    }

    if (msg.receiverId === userId && !msg.read) {
      const conv = conversationMap.get(otherUser.id)!;
      conv.unreadCount++;
    }
  }

  const conversations = Array.from(conversationMap.values()).sort(
    (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
          <span className="text-hacbc-red">Meldinger</span>
        </h1>
        <Button asChild>
          <Link href="/medlem/medlemmer">
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Ny samtale
          </Link>
        </Button>
      </div>

      {conversations.length === 0 ? (
        <div className="mt-12 text-center">
          <Mail className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Du har ingen meldinger ennå.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/medlem/medlemmer">
              Se medlemslisten for å sende en melding
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.otherUser.id}
              href={`/medlem/meldinger/${conv.otherUser.id}`}
            >
              <Card
                className={`border-border transition-colors hover:border-hacbc-red/30 ${
                  conv.unreadCount > 0 ? "border-hacbc-red/40" : ""
                }`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {conv.otherUser.avatarUrl ? (
                      <img
                        src={conv.otherUser.avatarUrl}
                        alt={conv.otherUser.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      conv.otherUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{conv.otherUser.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {conv.lastMessageAt.toLocaleDateString("nb-NO")}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-hacbc-red px-1.5 text-xs font-medium text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
