import { apiKeyClient } from "@better-auth/api-key/client";
import {
  adminClient,
  organizationClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    adminClient(),
    organizationClient(),
    apiKeyClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
