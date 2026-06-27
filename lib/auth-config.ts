import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { cookies } from "next/headers";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || (() => { console.warn("GOOGLE_CLIENT_ID is missing"); return ""; })(),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || (() => { console.warn("GOOGLE_CLIENT_SECRET is missing"); return ""; })(),
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email!;
        let dbUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!dbUser) {
          // Get role from cookie set on client side before redirect
          const cookieStore = await cookies();
          const userType = cookieStore.get("signup-usertype")?.value;

          // CRITICAL: If no signup cookie exists, this means the user clicked "Sign In" instead of "Sign Up".
          // We should NOT create a new account.
          if (!userType) {
            // Returning false or throwing error redirects to error page. 
            // We want to redirect to signup with a message.
            // NextAuth `signIn` callback returning a string redirects to that URL.
            return "/signup?error=AccountNotFound";
          }

          // Ensure username is unique
          let username = email.split("@")[0];
          let isUnique = false;
          let counter = 0;

          while (!isUnique) {
            const checkUsername = counter === 0 ? username : `${username}${counter}`;
            const existing = await prisma.user.findUnique({ where: { username: checkUsername } });
            if (!existing) {
              username = checkUsername;
              isUnique = true;
            } else {
              counter++;
            }
          }

          dbUser = await prisma.user.create({
            data: {
              email,
              fullName: user.name || "",
              username,
              password: null, // No password for OAuth users
              securityId: crypto.randomUUID(),
              usertype: (userType === "INSTITUTION" || userType === "STUDENT" || userType === "COMPANY") ? userType : "STUDENT",
              institutionname: userType === "INSTITUTION" ? (cookieStore.get("signup-institutionname")?.value ? decodeURIComponent(cookieStore.get("signup-institutionname")!.value) : null) : null,
            },
          });
        } else {
          // Updated: Check if existing user is missing institution name and update it if provided in cookie
          const cookieStore = await cookies();
          const signupInstitution = cookieStore.get("signup-institutionname")?.value;

          if (signupInstitution && dbUser.usertype === "INSTITUTION" && !dbUser.institutionname) {
            const decodedInstitution = decodeURIComponent(signupInstitution);
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: { institutionname: decodedInstitution }
            });
          }
        }

        (user as any).id = dbUser.id;
        (user as any).usertype = dbUser.usertype;
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.usertype = (user as any).usertype || "STUDENT";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).usertype = token.usertype as string | null;
      }
      return session;
    },
  },
};
