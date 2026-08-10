import type { Role } from "#server/db/schema";

declare module "#auth-utils" {
  interface User {
    id: string;
    email: string;
    name: string;
    username: string;
    avatar?: string | null;
    role: Role;
  }
}

declare module "h3" {
  interface H3EventContext {
    user?: User | null;
  }
}
