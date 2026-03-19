"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";

export type RegisterState = { error: string | null };

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const displayName = formData.get("displayName");

  if (!email || typeof email !== "string") {
    return { error: "Email is required." };
  }
  const emailTrimmed = email.trim().toLowerCase();
  if (!emailTrimmed) return { error: "Email is required." };
  if (!password || typeof password !== "string") {
    return { error: "Password is required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  try {
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({
      where: { email: emailTrimmed },
    });
    if (existing) {
      return { error: "An account with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: emailTrimmed,
        passwordHash,
        displayName:
          displayName && typeof displayName === "string"
            ? displayName.trim() || null
            : null,
        role: "USER",
      },
    });
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/api/auth/signin?callbackUrl=/&registered=1");
}
