"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import styles from "../Auth.module.css";
import { AtSign } from "lucide-react";

export default function OnboardingPage() {
  const [handle, setHandle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        if (data.email.endsWith('@mail.vsage.store')) {
          // Already onboarded
          router.push("/inbox");
        } else {
          setProfile(data);
          setIsInitializing(false);
        }
      } else {
        router.push("/login");
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim() || !profile) return;
    
    setIsLoading(true);
    const newEmail = `${handle.trim().toLowerCase()}@mail.vsage.store`;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ email: newEmail })
        .eq("id", profile.id);

      if (error) {
        if (error.code === '23505') {
          throw new Error("This handle is already taken. Please choose another one.");
        }
        throw error;
      }

      toast({
        type: "success",
        title: "Welcome aboard!",
        message: "Your mailbox is ready.",
      });
      
      router.push("/inbox");
      
    } catch (err: any) {
      toast({
        type: "error",
        title: "Failed to set handle",
        message: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <main className={styles.wrapper}>
        <div className="flex-center" style={{ height: "100vh" }}>
          <p className="text-muted">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.wrapper}>
      <div className={`${styles.container} animate-fade-in`}>
        <div className={styles.header}>
          <div className="flex-center" style={{ marginBottom: "0.5rem" }}>
            <div style={{ padding: "12px", background: "var(--accent-glow)", borderRadius: "50%", color: "var(--accent-primary)" }}>
              <AtSign size={28} />
            </div>
          </div>
          <h1 className={styles.title}>Choose your handle</h1>
          <p className={styles.subtitle}>Pick your unique PEP Mailbox Address to send and receive emails.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="handle" className={styles.label}>Mailbox Handle</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                id="handle"
                type="text"
                className="input-base"
                placeholder="e.g. john.doe"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9.-]/g, ""))}
                required
                disabled={isLoading}
                style={{ flex: 1 }}
              />
              <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>@mail.vsage.store</span>
            </div>
          </div>

          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Claim Handle
          </Button>
        </form>
      </div>
    </main>
  );
}
