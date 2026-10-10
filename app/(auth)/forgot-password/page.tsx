"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import styles from "../Auth.module.css";
import { KeyRound } from "lucide-react";
import { verifyForgotPasswordRateLimit, sanitizeAuthInput } from "../actions";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const rlResult = await verifyForgotPasswordRateLimit(email);
      if (rlResult.error) throw new Error(rlResult.error);

      const sanitizeResult = await sanitizeAuthInput({ email });
      if (sanitizeResult.error) throw new Error(sanitizeResult.error);

      const sanitizedData = sanitizeResult.data!;

      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedData.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        throw error;
      }

      setIsSubmitted(true);
      toast({
        type: "success",
        title: "Reset Email Sent",
        message: "If an account exists, a password reset link has been sent.",
      });

    } catch (err: any) {
      // Don't leak account existence for security
      if (err.message.includes("Too many")) {
        toast({
          type: "error",
          title: "Rate Limit Exceeded",
          message: err.message,
        });
      } else {
        toast({
          type: "success",
          title: "Reset Email Sent",
          message: "If an account exists, a password reset link has been sent.",
        });
        setIsSubmitted(true);
      }
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
              <KeyRound size={28} />
            </div>
          </div>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>Enter your email to receive a reset link</p>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleReset} className={styles.form}>
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

            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              Send Reset Link
            </Button>
            
            <div className="flex-center mt-4" style={{ gap: "1rem", fontSize: "0.875rem" }}>
              <Link href="/login" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                Back to login
              </Link>
            </div>
          </form>
        ) : (
          <div className={styles.form} style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
              Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
            </p>
            <Link href="/login" passHref legacyBehavior>
              <Button fullWidth variant="secondary" size="lg">
                Return to Login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
