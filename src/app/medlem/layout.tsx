import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/logg-inn?callbackUrl=/medlem");
  }

  if (session.user.memberStatus === "PENDING") {
    redirect("/registrer/venter");
  }

  if (session.user.memberStatus === "REJECTED") {
    redirect("/");
  }

  if (session.user.mustChangePassword) {
    redirect("/bytt-passord");
  }

  return <>{children}</>;
}
