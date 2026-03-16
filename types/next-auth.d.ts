import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      adminPermissions?: {
        manageUsers?: boolean;
        viewBugReports?: boolean;
        manageSuggestions?: boolean;
      };
    } & DefaultSession["user"];
  }
}
