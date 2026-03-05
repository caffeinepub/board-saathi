import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Cloud,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
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
import {
  clearCurrentSession,
  getCurrentUserAccount,
  isGuest,
  saveUserAccount,
  updateUserPassword,
} from "../utils/localStorageService";
import { flushQueue, pullAllData } from "../utils/syncService";

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { actor } = useActor();
  const guest = isGuest();
  const account = guest ? null : getCurrentUserAccount();

  const [name, setName] = useState(account?.name ?? "");
  const [school, setSchool] = useState(account?.school ?? "");
  const [studentClass, setStudentClass] = useState(
    String(account?.studentClass ?? "10"),
  );
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    setChangingPw(true);
    try {
      const success = updateUserPassword(account.username, newPassword);
      if (success) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error("Failed to change password");
      }
    } finally {
      setChangingPw(false);
    }
  };

  const handleLogout = () => {
    clearCurrentSession();
    queryClient.clear();
    toast.success("Logged out successfully");
    navigate({ to: "/login" });
  };

  const handleSyncNow = async () => {
    if (!account || !actor) {
      toast.error("Cannot sync: not connected to server.");
      return;
    }
    if (!navigator.onLine) {
      toast.error("Cannot sync: you are offline.");
      return;
    }
    setSyncing(true);
    try {
      const username = account.username;
      toast.info("Uploading your data...", { duration: 2000 });
      await flushQueue(username, actor);
      toast.info("Downloading latest data...", { duration: 2000 });
      await pullAllData(username, actor);
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">Username</span>
            <span className="font-medium">@{account.username}</span>
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

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="current-pw">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="current-pw"
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-9 pr-10"
                  placeholder="Current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="new-pw"
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9 pr-10"
                  placeholder="New password (min. 4 chars)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2"
              disabled={changingPw}
            >
              {changingPw ? (
                <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {changingPw ? "Changing..." : "Change Password"}
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
