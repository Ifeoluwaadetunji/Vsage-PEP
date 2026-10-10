"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import styles from "../Auth.module.css";
import { KeySquare } from "lucide-react";
import { sanitizeAuthInput } from "../actions";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is actually in a recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          type: "error",
          title: "Invalid Session",
          message: "Your password reset link is invalid or has expired.",
        });
        router.push("/login");
      }
    };
    checkSession();
  }, [supabase, router, toast]);

  const handleUpdate = async (e: React.FormEvent) => {
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
      // Validate password length with our common sanitize helper
      // Dummy email just to pass the schema that requires it
      const sanitizeResult = await sanitizeAuthInput({ email: "dummy@example.com", password });
      if (sanitizeResult.error) throw new Error(sanitizeResult.error);

      const { error } = await supabase.auth.updateUser({
        password: sanitizeResult.data!.password!,
      });

      if (error) {
        throw error;
      }

      toast({
        type: "success",
        title: "Password Updated",
        message: "Your password has been successfully updated.",
      });

      router.push("/login");

    } catch (err: any) {
      toast({
        type: "error",
        title: "Update Failed",
        message: err.message || "An error occurred. Please try again.",
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
              <KeySquare size={28} />
            </div>
          </div>
          <h1 className={styles.title}>Set New Password</h1>
          <p className={styles.subtitle}>Please enter your new password</p>
        </div>

        <form onSubmit={handleUpdate} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>New Password</label>
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
            <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password</label>
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

          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Update Password
          </Button>
        </form>
      </div>
    </main>
  );
}
