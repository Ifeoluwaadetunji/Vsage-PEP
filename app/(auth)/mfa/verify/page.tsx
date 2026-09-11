"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import styles from "../../Auth.module.css";
import { ShieldCheck } from "lucide-react";

export default function MfaVerifyPage() {
  const [verifyCode, setVerifyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    
    const checkFactors = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        
        const totpFactor = data.totp[0];
        if (!totpFactor) {
          router.push("/mfa/setup");
          return;
        }
        
        if (!ignore) {
          setFactorId(totpFactor.id);
        }
      } catch (err) {
        toast({ type: "error", title: "Error", message: "Failed to load authentication factors." });
      } finally {
        if (!ignore) setIsInitializing(false);
      }
    };

    checkFactors();
    return () => { ignore = true; };
  }, [supabase.auth.mfa, router, toast]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    
    setIsLoading(true);

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      });

      if (verify.error) throw verify.error;

      toast({
        type: "success",
        title: "Verified",
        message: "Authentication successful.",
      });
      
      router.push("/inbox");
      
    } catch (err: any) {
      toast({
        type: "error",
        title: "Verification Failed",
        message: "Invalid code. Please try again.",
      });
      setVerifyCode("");
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
              <ShieldCheck size={28} />
            </div>
          </div>
          <h1 className={styles.title}>Two-Factor Authentication</h1>
          <p className={styles.subtitle}>Enter the code from your authenticator app.</p>
        </div>

        {isInitializing ? (
          <div className="flex-center" style={{ height: "100px" }}>
             <p className="text-muted">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="code" className={styles.label}>Verification Code</label>
              <input
                id="code"
                type="text"
                className="input-base"
                placeholder="000000"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ""))}
                required
                disabled={isLoading}
                autoFocus
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.25em" }}
              />
            </div>

            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              Verify
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
