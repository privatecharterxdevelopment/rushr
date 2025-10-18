import NextAuth from "@/lib/auth-server-shim";
import Credentials from "next-auth/providers/credentials";
import { findUserByEmail } from "@/lib/memoryDB";
import { verifyPassword } from "@/lib/password";

const auth = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const user = await findUserByEmail(creds.email);
        if (!user) return null;
        const ok = await verifyPassword(creds.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});

export const { auth: getAuth, signIn, signOut } = auth;
export const GET = auth.handlers.GET;
export const POST = auth.handlers.POST;
