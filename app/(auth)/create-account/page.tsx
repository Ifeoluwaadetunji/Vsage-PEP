"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import styles from "../Auth.module.css";
import { UserPlus } from "lucide-react";
import { verifyCreateAccountRateLimit, sanitizeAuthInput } from "../actions";
import Link from "next/link";

export default function CreateAccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        type: "error",
        title: "Validation Error",
        message: "Passwords do not match.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const rlResult = await verifyCreateAccountRateLimit(email);
      if (rlResult.error) throw new Error(rlResult.error);

      const sanitizeResult = await sanitizeAuthInput({ 
        email, 
        password, 
        adminCode, 
        type: "create-account" 
      });
      if (sanitizeResult.error) throw new Error(sanitizeResult.error);

      const sanitizedData = sanitizeResult.data!;

      const { data, error } = await supabase.auth.signUp({
        email: sanitizedData.email,
        password: sanitizedData.password!,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        }
      });

      if (error) {
        throw error;
      }

      toast({
        type: "success",
        title: "Account Created",
        message: "Please check your email to verify your account.",
      });

      router.push("/login");

    } catch (err: any) {
      toast({
        type: "error",
        title: "Account Creation Failed",
        message: err.message || "An error occurred during sign up. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.wrapper}>
      <div className={`${styles.container} animate-fade-in`}>
        <div className={styles.header}>
          <div className="flex-center" style={{ marginBottom: "0.5rem" }}>
            <div style={{ padding: "12px", background: "var(--accent-glow)", borderRadius: "50%", color: "var(--accent-primary)" }}>
              <UserPlus size={28} />
            </div>
          </div>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Sign up for PEP Mail</p>
        </div>

        <form onSubmit={handleCreateAccount} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input
              id="email"
              type="email"
              className="input-base"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              className="input-base"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="input-base"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="adminCode" className={styles.label}>Admin Invite Code</label>
            <input
              id="adminCode"
              type="text"
              className="input-base"
              placeholder="6-digit code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              required
              disabled={isLoading}
              maxLength={6}
            />
          </div>

          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Sign Up
          </Button>

          <div className="flex-center mt-4" style={{ gap: "1rem", fontSize: "0.875rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>Already have an account?</span>
            <Link href="/login" style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 500 }}>
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
