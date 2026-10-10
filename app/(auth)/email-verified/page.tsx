"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import styles from "../Auth.module.css";
import { CheckCircle } from "lucide-react";

export default function EmailVerifiedPage() {
  const router = useRouter();

  return (
    <main className={styles.wrapper}>
      <div className={`${styles.container} animate-fade-in`}>
        <div className={styles.header}>
          <div className="flex-center" style={{ marginBottom: "0.5rem" }}>
            <div style={{ padding: "12px", background: "var(--accent-glow)", borderRadius: "50%", color: "var(--accent-primary)" }}>
              <CheckCircle size={28} />
            </div>
          </div>
          <h1 className={styles.title}>Email Verified!</h1>
          <p className={styles.subtitle}>Your account has been successfully verified.</p>
        </div>

        <div className={styles.form} style={{ marginTop: "1rem" }}>
          <Button onClick={() => router.push("/inbox")} fullWidth size="lg">
            Continue to Inbox
          </Button>
        </div>
      </div>
    </main>
  );
}
