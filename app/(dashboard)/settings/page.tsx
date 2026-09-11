"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, User, Users, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

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
        if (data) setFullName(data.full_name);
      }
      setIsLoading(false);
    };
    loadProfile();
  }, [supabase]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile.id);
      
    if (error) {
      toast({ type: "error", title: "Error", message: "Failed to update profile" });
    } else {
      toast({ type: "success", title: "Profile Updated", message: "Your name has been saved successfully." });
    }
    
    setIsSaving(false);
  };

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
            <p className="text-muted" style={{ fontSize: "0.875rem" }}>Manage your personal details</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>Full Name</label>
            <div style={{ display: "flex", gap: "1rem", maxWidth: "500px" }}>
              <input 
                type="text" 
                className="input-base" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: "100%" }}
              />
              <Button onClick={handleSaveProfile} isLoading={isSaving} leftIcon={<Check size={16} />}>
                Save
              </Button>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>Email Address</label>
            <input 
              type="email" 
              className="input-base" 
              value={profile?.email || ""} 
              disabled 
              style={{ width: "100%", maxWidth: "400px", background: "var(--bg-hover)", opacity: 0.7 }}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Email address cannot be changed.
            </p>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "2rem", marginBottom: "2rem" }}>
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

      {profile?.role === 'admin' && (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ padding: "12px", background: "var(--bg-hover)", borderRadius: "50%", color: "var(--text-primary)" }}>
              <Users size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "500" }}>Admin Controls</h2>
              <p className="text-muted" style={{ fontSize: "0.875rem" }}>Manage the platform and its users</p>
            </div>
          </div>
          
          <p style={{ marginBottom: "1.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Access the admin dashboard to import new users, view system metrics, or manage existing accounts.
          </p>

          <Button onClick={() => router.push('/import')} variant="secondary">
            Go to Admin Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
