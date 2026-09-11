"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import styles from "../../Auth.module.css";
import { ShieldCheck } from "lucide-react";

export default function MfaSetupPage() {
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    
    const initializeMfa = async () => {
      try {
        // First check for and remove any existing unverified factors so we can get a fresh QR code
        const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();
        if (factorsData?.totp) {
          const unverifiedFactors = factorsData.totp.filter(f => f.status === 'unverified');
          for (const factor of unverifiedFactors) {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          }
        }

        const { data: userData } = await supabase.auth.getUser();
        const userEmail = userData?.user?.email || 'Admin';

        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          issuer: 'Vsage Mail',
          friendlyName: userEmail
        });

        if (error) throw error;
        
        if (!ignore && data) {
          setFactorId(data.id);
          setQrCode(data.totp.qr_code);
        }
      } catch (err: any) {
        toast({
          type: "error",
          title: "Setup Failed",
          message: err.message || "Could not initialize MFA setup.",
        });
      } finally {
        if (!ignore) setIsInitializing(false);
      }
    };

    initializeMfa();

    return () => { ignore = true; };
  }, [supabase.auth.mfa, toast]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
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
        title: "MFA Enabled",
        message: "Your account is now secured.",
      });
      
      router.push("/inbox");
      
    } catch (err: any) {
      toast({
        type: "error",
        title: "Verification Failed",
        message: "Invalid code. Please try again.",
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
            <div style={{ padding: "12px", background: "var(--success-bg)", borderRadius: "50%", color: "var(--success)" }}>
              <ShieldCheck size={28} />
            </div>
          </div>
          <h1 className={styles.title}>Secure Your Account</h1>
          <p className={styles.subtitle}>Scan the QR code with your authenticator app.</p>
        </div>

        {isInitializing ? (
          <div className="flex-center" style={{ height: "200px" }}>
             <p className="text-muted">Generating QR code...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className={styles.form}>
            {qrCode && (
              <div className={styles.qrContainer}>
                <img 
                  src={qrCode} 
                  alt="MFA QR Code" 
                  style={{ width: '100%', maxWidth: '250px', height: 'auto', display: 'block' }} 
                />
              </div>
            )}
            
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
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.25em" }}
              />
            </div>

            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              Verify and Continue
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
