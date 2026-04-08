import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { ObjectId } from "mongodb";
import { mongoClient } from "@/lib/mongodb";
import { authConfig } from "./auth.config";
import { getUsersCollection } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(mongoClient),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
        // Fetch role fresh from DB so role changes reflect immediately
        try {
          const col = await getUsersCollection();
          const u = await col.findOne(
            { _id: new ObjectId(token.sub) },
            { projection: { role: 1, profileImage: 1, adminPermissions: 1 } }
          );
          session.user.role = u?.role ?? "member";
          if (u?.profileImage) session.user.image = u.profileImage;
          if (u?.adminPermissions) session.user.adminPermissions = u.adminPermissions;
        } catch {
          session.user.role = "member";
        }
      }
      return session;
    },
  },
});
