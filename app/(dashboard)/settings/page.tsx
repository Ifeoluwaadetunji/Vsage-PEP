"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      setIsLoading(false);
    };
    loadProfile();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: "100%", width: "100%" }}>
        <p className="text-muted">Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "2rem" }}>Settings</h1>

      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "2rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ padding: "12px", background: "var(--bg-hover)", borderRadius: "50%", color: "var(--text-primary)" }}>
            <User size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "500" }}>Profile Information</h2>
            <p className="text-muted" style={{ fontSize: "0.875rem" }}>Your personal details</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>Full Name</label>
            <input 
              type="text" 
              className="input-base" 
              value={profile?.full_name || ""} 
              disabled 
              style={{ width: "100%", maxWidth: "400px", background: "var(--bg-hover)" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>Email Address</label>
            <input 
              type="email" 
              className="input-base" 
              value={profile?.email || ""} 
              disabled 
              style={{ width: "100%", maxWidth: "400px", background: "var(--bg-hover)" }}
            />
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ padding: "12px", background: "var(--success-bg)", borderRadius: "50%", color: "var(--success)" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "500" }}>Security</h2>
            <p className="text-muted" style={{ fontSize: "0.875rem" }}>Manage your Two-Factor Authentication</p>
          </div>
        </div>
        
        <p style={{ marginBottom: "1.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Your account is protected by an Authenticator App. If you lose access to your device, you can re-enroll a new device here.
        </p>

        <Button onClick={() => router.push('/mfa/setup')} variant="secondary">
          Re-enroll Authenticator App
        </Button>
      </div>
    </div>
  );
}
