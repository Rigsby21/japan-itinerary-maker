/**
 * Phase 1 — NextAuth route handler. All auth routes (signin, signout, callback, etc.) live here.
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
