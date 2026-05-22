import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? "";
        session.user.name = token.name ?? "";
        session.user.image = typeof token.picture === "string" ? token.picture : undefined;
      }
      return session;
    }
  }
});

export async function safeAuth() {
  try {
    return await auth();
  } catch (error) {
    console.error("Auth session lookup failed.", error);
    return null;
  }
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(email.toLowerCase());
}
