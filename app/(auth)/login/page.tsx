"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import styles from "../Auth.module.css";
import { Mail } from "lucide-react";
import { verifyLoginRateLimit, sanitizeAuthInput } from "../actions";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const rlResult = await verifyLoginRateLimit(email);
      if (rlResult.error) throw new Error(rlResult.error);

      const sanitizeResult = await sanitizeAuthInput({ email, password });
      if (sanitizeResult.error) throw new Error(sanitizeResult.error);

      const sanitizedData = sanitizeResult.data!;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedData.email,
        password: sanitizedData.password!,
      });

      if (error) {
        throw error;
      }

      // Check MFA Status
      const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfaError) throw mfaError;

      if (mfaData.nextLevel === 'aal2' && mfaData.currentLevel !== 'aal2') {
        // Enrolled but not verified this session
        router.push("/mfa/verify");
      } else if (mfaData.nextLevel === 'aal1') {
        // Not enrolled yet
        router.push("/mfa/setup");
      } else {
        // Fully authenticated (aal2 current)
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('email').eq('id', user?.id).single();
        if (profile?.email?.endsWith('@mail.vsage.store')) {
          router.push("/inbox");
        } else {
          router.push("/onboarding");
        }
      }

    } catch (err: any) {
      toast({
        type: "error",
        title: "Authentication Failed",
        message: err.message || "Invalid email or password. Please try again.",
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
            <img src="/logo.png" alt="Vsage Mail Logo" style={{ width: 64, height: 64, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          </div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your PEP Mail account</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
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
            />
          </div>

          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Sign In
          </Button>

          <div className="flex-center mt-4" style={{ gap: "1rem", fontSize: "0.875rem" }}>
            <Link href="/forgot-password" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
              Forgot password?
            </Link>
            <span style={{ color: "var(--border-strong)" }}>|</span>
            <Link href="/create-account" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
              Create account
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
