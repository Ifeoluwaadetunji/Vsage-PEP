"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { loginRateLimit, createAccountRateLimit, forgotPasswordRateLimit } from "@/lib/security/ratelimit";
import { verifyAdminCode } from "@/lib/security/adminCode";

const authSchema = z.object({
  email: z.string().email("Invalid email address").transform((e) => e.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  adminCode: z.string().optional(),
  fullName: z.string().min(2, "Preferred name must be at least 2 characters").optional(),
});

export async function verifyLoginRateLimit(email: string) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "127.0.0.1";
  
  const { success } = await loginRateLimit.limit(`login_${ip}`);
  if (!success) {
    return { error: "Too many login attempts. Please try again later." };
  }
  
  return { success: true };
}

export async function verifyCreateAccountRateLimit(email: string) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "127.0.0.1";
  
  const { success } = await createAccountRateLimit.limit(`create_account_${ip}`);
  if (!success) {
    return { error: "Too many account creation attempts. Please try again later." };
  }
  
  return { success: true };
}

export async function verifyForgotPasswordRateLimit(email: string) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "127.0.0.1";
  
  const { success } = await forgotPasswordRateLimit.limit(`forgot_${ip}`);
  if (!success) {
    return { error: "Too many requests. Please try again later." };
  }
  
  return { success: true };
}

export async function sanitizeAuthInput(data: { 
  email: string; 
  password?: string; 
  adminCode?: string;
  fullName?: string;
  type?: "login" | "create-account" | "forgot-password" | "update-password";
}) {
  try {
    if (data.type === "create-account") {
      if (!data.adminCode || !verifyAdminCode(data.adminCode)) {
        return { error: "Invalid or expired Admin Invite Code" };
      }
      if (!data.fullName || data.fullName.trim().length < 2) {
        return { error: "Preferred name must be at least 2 characters" };
      }
    }

    if (data.password !== undefined) {
      const parsed = authSchema.parse(data);
      return { success: true, data: parsed as { email: string; password?: string; adminCode?: string; fullName?: string } };
    } else {
      const emailOnlySchema = z.object({
        email: z.string().email("Invalid email address").transform((e) => e.toLowerCase().trim()),
      });
      const parsed = emailOnlySchema.parse(data);
      return { success: true, data: parsed as { email: string; password?: string; adminCode?: string; fullName?: string } };
    }
  } catch (error: any) {
    return { error: error.errors?.[0]?.message || "Invalid input" };
  }
}
