import type { Role } from "@nuxthub/db/schema";
import * as v from "valibot";

export const signInSchema = v.object({
  identifier: v.pipe(v.string(), v.minLength(1, "Fill with email or username")),
  password: v.pipe(
    v.string(),
    v.minLength(8, "Minimum password length is 8 character")
  ),
});

export const signUpSchema = v.object({
  username: v.pipe(
    v.string(),
    v.minLength(3, "Username minimal 3 karakter"),
    v.maxLength(30, "Username maksimal 30 karakter"),
    v.regex(
      /^[a-zA-Z0-9_]+$/,
      "Username hanya boleh huruf, angka, dan underscore"
    )
  ),
  name: v.pipe(v.string(), v.minLength(2, "Name minimum 2 character")),
  email: v.pipe(v.string(), v.email("Not valid email format")),
  password: v.pipe(
    v.string(),
    v.minLength(8, "Minimum password length is 8 character")
  ),
});

export interface AuthUser {
  id: string;
  role: Role;
}
export type SignInType = v.InferOutput<typeof signInSchema>;
export type SignUpType = v.InferOutput<typeof signUpSchema>;
