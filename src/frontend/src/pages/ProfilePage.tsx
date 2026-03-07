import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Cloud,
  Fingerprint,
  GraduationCap,
  LogOut,
  RefreshCw,
  Save,
  School,
  User,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  clearCurrentSession,
  clearIIPrincipal,
  clearParentSession,
  getCurrentUserAccount,
  getIIPrincipal,
  isGuest,
  saveUserAccount,
} from "../utils/localStorageService";
import { flushQueue, pullAllData } from "../utils/syncService";

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { actor } = useActor();
  const { clear: iiClear } = useInternetIdentity();
  const guest = isGuest();
  const account = guest ? null : getCurrentUserAccount();
  const iiPrincipal = getIIPrincipal();
  const isIIUser = !!iiPrincipal;

  const [name, setName] = useState(account?.name ?? "");
  const [school, setSchool] = useState(account?.school ?? "");
  const [studentClass, setStudentClass] = useState(
    String(account?.studentClass ?? "10"),
  );
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    if (!name.trim() || !school.trim()) {
      toast.error("Name and school are required");
      return;
    }
    setSaving(true);
    try {
      saveUserAccount({
        ...account,
        name: name.trim(),
        school: school.trim(),
        studentClass: Number.parseInt(studentClass, 10) || 10,
      });
      toast.success("Profile updated successfully!");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    // Clear Internet Identity session
    iiClear();
    clearIIPrincipal();
    // Clear legacy session
    clearCurrentSession();
    clearParentSession();
    queryClient.clear();
    toast.success("Logged out successfully");
    // Force a full page reload to "/login" so the router re-evaluates auth state
    // from scratch — prevents cached route state from keeping the user logged in.
    window.location.href = "/login";
  };

  const handleSyncNow = async () => {
    if (!actor) {
      toast.error("Cannot sync: not connected to server.");
      return;
    }
    if (!navigator.onLine) {
      toast.error("Cannot sync: you are offline.");
      return;
    }
    // Determine the sync identifier: principal for II users, username for legacy
    const syncKey = iiPrincipal || account?.username;
    if (!syncKey) {
      toast.error("Cannot sync: no account found.");
      return;
    }
    setSyncing(true);
    try {
      toast.info("Uploading your data...", { duration: 2000 });
      await flushQueue(syncKey, actor);
      toast.info("Downloading latest data...", { duration: 2000 });
      await pullAllData(syncKey, actor);
      toast.success("Data synced successfully! ✓");
    } catch (e) {
      toast.error("Sync failed. Please try again.");
      console.error("[ProfilePage] Sync failed:", e);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpgradeApp = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          reg.update();
        }
      });
    }
    setTimeout(() => window.location.reload(), 500);
    toast.success("Checking for updates...");
  };

  if (guest) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 pb-24">
        <Card className="text-center py-12">
          <CardContent>
            <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Guest Mode</p>
            <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
              Create an account to save your profile and data.
            </p>
            <Button onClick={() => navigate({ to: "/login" })}>
              Login / Register
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">
          No account found. Please log in.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{account.name}</h1>
          <p className="text-sm text-muted-foreground">@{account.username}</p>
        </div>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {/* Auth method badge */}
          {isIIUser && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <Fingerprint className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary">
                  Internet Identity
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {iiPrincipal}
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{account.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Class</span>
            <span className="font-medium">Class {account.studentClass}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">School</span>
            <span className="font-medium text-right max-w-[60%] truncate">
              {account.school}
            </span>
          </div>
          {account.createdAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member since</span>
              <span className="font-medium">
                {new Date(account.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Edit Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  placeholder="Your full name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="school">School</Label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="school"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="pl-9"
                  placeholder="Your school name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="class">Class</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="class"
                  type="number"
                  min="1"
                  max="12"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={saving}>
              {saving ? (
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sync Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="w-4 h-4 text-primary" />
            Sync Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Upload your local data to the global server and download the latest
            from any other device you've used. Sync keeps your profile
            consistent across all devices.
          </p>
          <Button
            data-ocid="profile.sync.primary_button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleSyncNow}
            disabled={syncing || !actor}
          >
            {syncing ? (
              <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : (
              <Cloud className="w-4 h-4" />
            )}
            {syncing ? "Syncing..." : "Sync Now"}
          </Button>
          {!actor && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Connect to the internet to enable sync.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upgrade App */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            App Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            If the app feels outdated, tap below to check for and apply the
            latest update.
          </p>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleUpgradeApp}
          >
            <RefreshCw className="w-4 h-4" />
            Check for Updates
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardContent className="pt-4">
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
