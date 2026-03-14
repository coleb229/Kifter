import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Edge-safe config — no adapter, no Node.js-only imports.
// Used by middleware and composed into the full auth.ts config.
export const authConfig: NextAuthConfig = {
  providers: [Google],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
};
