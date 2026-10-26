import { authClient } from "~/utils/auth-client";

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);
  if (session.value) {
    const redirect =
      typeof to.query.redirect === "string" ? to.query.redirect : "";
    if (redirect.startsWith("/") && !redirect.startsWith("//")) {
      return navigateTo(redirect);
    }
    return navigateTo("/");
  }
});
