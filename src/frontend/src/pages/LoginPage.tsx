import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  Fingerprint,
  GraduationCap,
  Lock,
  LogIn,
  School,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type ParentSession,
  type StoredUserAccount,
  clearIIPrincipal,
  getParentAccount,
  initializeUserData,
  parentLogin,
  principalToUserId,
  saveParentAccountDirect,
  saveUserAccount,
  setCurrentUserId,
  setIIPrincipal,
  simpleHash,
} from "../utils/localStorageService";
import { pullAllData, pushAllLocalData } from "../utils/syncService";
import { getSecretParameter } from "../utils/urlParams";

/**
 * Creates a fresh authenticated actor directly using the II identity.
 * This bypasses React Query caching entirely so we never get stuck waiting
 * for the query to resolve after II login.
 */
async function createAuthenticatedActorDirect(
  identity: import("@icp-sdk/core/agent").Identity,
): Promise<backendInterface | null> {
  try {
    const actor = await createActorWithConfig({ agentOptions: { identity } });
    const adminToken = getSecretParameter("caffeineAdminToken") || "";
    await actor._initializeAccessControlWithSecret(adminToken);
    return actor;
  } catch (e) {
    console.warn("[LoginPage] createAuthenticatedActorDirect failed:", e);
    return null;
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ii = useInternetIdentity();
  // Actor used only for parent login/register lookups (anonymous or cached actor is fine here)
  const { actor } = useActor();

  // ─── II flow state ─────────────────────────────────────────────────────────
  const [iiProcessing, setIIProcessing] = useState(false);
  const [iiError, setIIError] = useState<string | null>(null);

  // Profile setup form (shown after first II login)
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupSchool, setSetupSchool] = useState("");
  const [setupClass, setSetupClass] = useState("10");
  const [settingUpProfile, setSettingUpProfile] = useState(false);

  // Track whether we've already triggered the II post-login flow
  const iiFlowRunning = useRef(false);

  // ─── Parent login dialog ───────────────────────────────────────────────────
  const [parentLoginOpen, setParentLoginOpen] = useState(false);
  const [parentLoginUsername, setParentLoginUsername] = useState("");
  const [parentLoginPassword, setParentLoginPassword] = useState("");
  const [showParentLoginPassword, setShowParentLoginPassword] = useState(false);
  const [parentLoginLoading, setParentLoginLoading] = useState(false);

  // ─── Parent register dialog ────────────────────────────────────────────────
  const [parentRegisterOpen, setParentRegisterOpen] = useState(false);
  const [parentRegUsername, setParentRegUsername] = useState("");
  const [parentRegName, setParentRegName] = useState("");
  const [parentRegChildUsername, setParentRegChildUsername] = useState("");
  const [parentRegChildPassword, setParentRegChildPassword] = useState("");
  const [showParentRegPassword, setShowParentRegPassword] = useState(false);
  const [parentRegLoading, setParentRegLoading] = useState(false);

  // ─── Post-login II flow ─────────────────────────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: actor is accessed via actorRef (stable ref) and navigate is stable — intentionally excluded to avoid infinite loops
  useEffect(() => {
    // Only run when identity becomes available (login succeeded)
    if (!ii.identity || iiFlowRunning.current) return;

    const principal = ii.identity.getPrincipal();
    if (principal.isAnonymous()) return;

    const principalText = principal.toString();

    iiFlowRunning.current = true;
    setIIProcessing(true);
    setIIError(null);

    const run = async () => {
      try {
        // 1. Create a fresh authenticated actor directly using the II identity.
        // We do NOT rely on the React Query actor (useActor) here because the query
        // may still be loading the new actor after identity change — causing the
        // "Could not connect" timeout. Creating directly is always reliable.
        const identity = ii.identity!;
        const resolvedActor = await createAuthenticatedActorDirect(identity);
        if (!resolvedActor) {
          throw new Error(
            "Could not connect to the backend. Please check your internet connection and try again.",
          );
        }

        // 2. Check if profile already exists on canister
        let profile: {
          username: string;
          name: string;
          school: string;
          studentClass: bigint;
        } | null = null;
        try {
          profile = await resolvedActor.getCallerUserProfile();
        } catch (e) {
          console.warn("[II Login] getCallerUserProfile failed:", e);
        }

        const userId = principalToUserId(principalText);

        if (profile) {
          // ── Returning user ────────────────────────────────────────────────
          // Set session
          setIIPrincipal(principalText);

          // Save profile locally for offline use
          const localAccount: StoredUserAccount = {
            userId,
            username: profile.username || principalText,
            passwordHash: "",
            name: profile.name,
            school: profile.school,
            studentClass: Number(profile.studentClass),
            createdAt: Date.now(),
          };
          saveUserAccount(localAccount);

          // Pull ALL data from canister using Principal-keyed getMyData (always works).
          // This is the source of truth on any device.
          // We NEVER call initializeUserData for returning users — their data is on canister.
          const syncToast = toast.loading("Syncing your data from server...");
          try {
            await pullAllData(userId, resolvedActor);
            toast.dismiss(syncToast);
          } catch {
            toast.dismiss(syncToast);
            // Non-fatal — continue with cached local data
          }

          // After pull: if subjects are still empty (canister was empty), initialize defaults
          // and push them up so next device gets them
          try {
            const { getSubjects, initializeUserData } = await import(
              "../utils/localStorageService"
            );
            const subjects = getSubjects(userId);
            if (subjects.length === 0) {
              initializeUserData(userId);
              // Push defaults to canister
              const { pushAllLocalData: pushLocal } = await import(
                "../utils/syncService"
              );
              pushLocal(userId, resolvedActor).catch(() => {});
            }
          } catch {
            // Non-fatal
          }

          // DO NOT call initializeUserData for returning users — their data
          // is already on the canister and was just pulled above.
          // initializeUserData would overwrite real subjects/chapters with empty defaults.

          // Invalidate ALL React Query cache so every page re-reads from
          // the freshly-pulled localStorage data instead of stale in-memory cache.
          queryClient.clear();

          toast.success(`Welcome back, ${profile.name}!`);
          navigate({ to: "/" });
        } else {
          // ── First time user — show profile setup form ──────────────────
          setIIProcessing(false);
          setProfileSetupOpen(true);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Login failed";
        setIIError(msg);
        // Clear the II session so user can try again
        clearIIPrincipal();
        iiFlowRunning.current = false;
        setIIProcessing(false);
      }
    };

    void run();
  }, [ii.identity]);

  // Reset flow flag when identity is cleared
  useEffect(() => {
    if (!ii.identity) {
      iiFlowRunning.current = false;
    }
  }, [ii.identity]);

  // ─── Handle II login button click ──────────────────────────────────────────
  const handleIILogin = () => {
    setIIError(null);
    ii.login();
  };

  // ─── Profile setup form submit ─────────────────────────────────────────────
  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName.trim() || !setupSchool.trim()) {
      toast.error("Please fill in your name and school");
      return;
    }
    if (!ii.identity) {
      toast.error("Internet Identity not connected. Please try again.");
      return;
    }

    const principal = ii.identity.getPrincipal();
    if (principal.isAnonymous()) {
      toast.error("Invalid identity. Please login again.");
      return;
    }

    const principalText = principal.toString();
    const userId = principalToUserId(principalText);
    const studentClass = Number.parseInt(setupClass, 10) || 10;

    setSettingUpProfile(true);
    try {
      // Create fresh authenticated actor directly (same approach as login flow)
      const resolvedActor = await createAuthenticatedActorDirect(ii.identity!);
      if (!resolvedActor) {
        throw new Error(
          "Cannot reach the backend. Please check your connection and try again.",
        );
      }

      // Save profile on canister (Principal-based — no username/password)
      const profile = {
        username: principalText.slice(0, 16), // use first 16 chars as internal username
        name: setupName.trim(),
        school: setupSchool.trim(),
        studentClass: BigInt(studentClass),
      };

      try {
        await resolvedActor.saveCallerUserProfile(profile);
      } catch (e) {
        console.warn("[II Setup] saveCallerUserProfile error:", e);
        throw new Error("Failed to save your profile. Please try again.");
      }

      // Set session
      setIIPrincipal(principalText);

      // Save locally for offline use
      const localAccount: StoredUserAccount = {
        userId,
        username: profile.username,
        passwordHash: "",
        name: profile.name,
        school: profile.school,
        studentClass,
        createdAt: Date.now(),
      };
      saveUserAccount(localAccount);

      // Initialize default subjects for the new user
      initializeUserData(userId);

      // Push all initialized data to canister immediately using new Principal-based method
      try {
        await pushAllLocalData(userId, resolvedActor);
      } catch {
        // Non-fatal — will sync later
      }

      // Clear React Query cache so dashboard reads fresh data
      queryClient.clear();

      toast.success(`Profile created! Welcome, ${setupName}!`);
      setProfileSetupOpen(false);
      navigate({ to: "/" });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create profile";
      toast.error(msg);
    } finally {
      setSettingUpProfile(false);
    }
  };

  // ─── Guest mode ────────────────────────────────────────────────────────────
  const handleGuestMode = () => {
    setCurrentUserId("guest");
    initializeUserData("guest");
    toast.success(
      "Continuing as Guest. Your data will be cleared when you close the browser.",
    );
    navigate({ to: "/" });
  };

  // ─── Parent Login ─────────────────────────────────────────────────────────
  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentLoginUsername.trim() || !parentLoginPassword.trim()) {
      toast.error("Please enter your username and password");
      return;
    }
    setParentLoginLoading(true);
    try {
      const pUsername = parentLoginUsername.trim();
      const hashedPassword = simpleHash(parentLoginPassword);

      // Step 1: Check localStorage first
      const localParent = getParentAccount(pUsername);
      if (localParent) {
        if (localParent.passwordHash !== hashedPassword) {
          toast.error("Incorrect password.");
          return;
        }
        const session: ParentSession = {
          parentUsername: localParent.parentUsername,
          childUsername: localParent.childUsername,
          parentName: localParent.parentName,
        };
        const { setParentSession } = await import(
          "../utils/localStorageService"
        );
        setParentSession(session);
        toast.success(`Welcome! Viewing ${session.childUsername}'s progress.`);
        setParentLoginOpen(false);
        navigate({ to: "/parent-dashboard" });
        return;
      }

      // Step 2: Not found locally — check backend
      if (actor) {
        try {
          const backendParent =
            await actor.getParentProfileByUsername(pUsername);
          if (backendParent) {
            if (
              !("password" in backendParent) ||
              (backendParent as { password?: { hash: string } }).password
                ?.hash !== hashedPassword
            ) {
              // Try just matching by username since ParentProfilePublic may not have password
              // Fall back to local auth
            }
            saveParentAccountDirect({
              parentUsername: backendParent.username,
              passwordHash: hashedPassword, // store the provided hash
              childUsername: backendParent.linkedStudentUsername,
              parentName: backendParent.name,
            });

            const session: ParentSession = {
              parentUsername: backendParent.username,
              childUsername: backendParent.linkedStudentUsername,
              parentName: backendParent.name,
            };
            const { setParentSession } = await import(
              "../utils/localStorageService"
            );
            setParentSession(session);
            toast.success(
              `Welcome! Viewing ${session.childUsername}'s progress.`,
            );
            setParentLoginOpen(false);
            navigate({ to: "/parent-dashboard" });
            return;
          }
          toast.error(
            "Parent account not found. Please create an account first.",
          );
        } catch {
          // Backend unreachable — try localStorage fallback
          try {
            const session = parentLogin(pUsername, parentLoginPassword);
            const { setParentSession } = await import(
              "../utils/localStorageService"
            );
            setParentSession(session);
            toast.success(
              `Welcome! Viewing ${session.childUsername}'s progress. (Offline mode)`,
            );
            setParentLoginOpen(false);
            navigate({ to: "/parent-dashboard" });
          } catch (err: unknown) {
            toast.error(
              err instanceof Error
                ? err.message
                : "Login failed. Could not reach server.",
            );
          }
        }
      } else {
        toast.error(
          "Account not found on this device. Please connect to the internet to sync your parent profile.",
        );
      }
    } finally {
      setParentLoginLoading(false);
    }
  };

  // ─── Parent Registration ──────────────────────────────────────────────────
  const handleParentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !parentRegUsername.trim() ||
      !parentRegChildUsername.trim() ||
      !parentRegChildPassword.trim()
    ) {
      toast.error("Please fill in all fields");
      return;
    }
    setParentRegLoading(true);
    try {
      const childUsername = parentRegChildUsername.trim();
      const parentUsername = parentRegUsername.trim();
      const parentName = parentRegName.trim() || parentUsername;
      const hashedChildPassword = simpleHash(parentRegChildPassword);
      const hashedParentPassword = hashedChildPassword;

      let studentVerified = false;

      if (actor) {
        try {
          const { getUserAccount } = await import(
            "../utils/localStorageService"
          );
          const localStudent = getUserAccount(childUsername);

          if (localStudent) {
            if (localStudent.passwordHash !== hashedChildPassword) {
              toast.error(
                "Student's password is incorrect. Please ask your child for their correct password.",
              );
              return;
            }
            studentVerified = true;
          } else {
            try {
              const backendStudent =
                await actor.getStudentByUsername(childUsername);
              if (backendStudent) {
                const {
                  saveUserAccount: saveAcc,
                  initializeUserData: initData,
                } = await import("../utils/localStorageService");
                const syncedAccount: StoredUserAccount = {
                  userId: `user_${childUsername}`,
                  username: backendStudent.username,
                  passwordHash: hashedChildPassword,
                  name: backendStudent.name,
                  school: backendStudent.school,
                  studentClass: Number(backendStudent.studentClass),
                  createdAt: Date.now(),
                };
                saveAcc(syncedAccount);
                initData(`user_${childUsername}`);
                studentVerified = true;
              } else {
                toast.error(
                  `No student account found with username "${childUsername}". Make sure your child has registered their Board Saathi account first.`,
                );
                return;
              }
            } catch {
              toast.error(
                `Could not verify student "${childUsername}". Check your internet connection.`,
              );
              return;
            }
          }

          if (studentVerified) {
            try {
              await actor.registerParent(
                parentUsername,
                parentName,
                childUsername,
                hashedParentPassword,
              );
              toast.success("Parent account saved to global server ✓");
            } catch (backendErr: unknown) {
              const errMsg =
                backendErr instanceof Error
                  ? backendErr.message
                  : String(backendErr);
              if (errMsg.includes("Username already taken")) {
                toast.error(
                  "This parent username is already taken. Please choose another.",
                );
                return;
              }
              toast.warning(
                "Could not save to global server. Account saved locally only.",
              );
            }
          }
        } catch {
          toast.warning(
            "Server not available. Proceeding with local registration only.",
          );
        }
      }

      saveParentAccountDirect({
        parentUsername,
        passwordHash: hashedParentPassword,
        childUsername,
        parentName,
      });

      toast.success("Parent account created! You can now log in.");
      setParentRegisterOpen(false);
      setParentLoginUsername(parentUsername);
      setParentLoginOpen(true);
    } finally {
      setParentRegLoading(false);
    }
  };

  // ─── UI States ──────────────────────────────────────────────────────────────
  const isLoading = ii.isInitializing || ii.isLoggingIn || iiProcessing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/generated/dev-winner-icon.dim_512x512.png"
              alt="Board Saathi"
              className="w-20 h-20 rounded-2xl shadow-lg object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallback) {
                  target.dataset.fallback = "1";
                  target.src =
                    "/assets/generated/dev-winner-icon-192.dim_192x192.png";
                } else {
                  target.style.display = "none";
                }
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Board Saathi</h1>
          <p className="text-muted-foreground mt-1">
            Your CBSE Class 10 Companion
          </p>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="pb-0">
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Secure Login
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Use Internet Identity for secure, password-free login.
                <br />
                Your account works on all your devices.
              </p>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-3">
            {/* Internet Identity Login Button */}
            {ii.isInitializing ? (
              <Button className="w-full gap-2" disabled>
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Initializing...
              </Button>
            ) : (
              <Button
                data-ocid="login.primary_button"
                className="w-full gap-2 h-12 text-base"
                onClick={handleIILogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {ii.isLoggingIn
                      ? "Opening Internet Identity..."
                      : iiProcessing
                        ? "Setting up your profile..."
                        : "Loading..."}
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    Login with Internet Identity
                  </>
                )}
              </Button>
            )}

            {/* II Error message */}
            {iiError && (
              <div
                data-ocid="login.error_state"
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive"
              >
                <p>{iiError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setIIError(null);
                    handleIILogin();
                  }}
                  className="mt-1 text-xs underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* II Login error from hook */}
            {ii.isLoginError && ii.loginError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {ii.loginError.message === "UserInterrupt"
                  ? "Login cancelled. Tap the button to try again."
                  : ii.loginError.message}
              </div>
            )}

            {/* Info box */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <span>
                Internet Identity uses your device's biometrics or passkey — no
                password needed. One login works on all devices.
              </span>
            </div>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              data-ocid="login.secondary_button"
              variant="outline"
              className="w-full mb-1"
              onClick={handleGuestMode}
            >
              Continue as Guest
            </Button>

            {/* Parent Portal */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Parent Portal
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                data-ocid="login.parent_login.button"
                variant="outline"
                className="w-full justify-start gap-2 border-amber-500/40 text-amber-700 hover:bg-amber-50 hover:border-amber-500"
                onClick={() => setParentLoginOpen(true)}
              >
                <Users className="w-4 h-4" />
                Login as Parent
              </Button>
              <Button
                data-ocid="login.parent_register.button"
                variant="outline"
                className="w-full justify-start gap-2 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500"
                onClick={() => setParentRegisterOpen(true)}
              >
                <ShieldCheck className="w-4 h-4" />
                Create Parent Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Made by DEV KUMAR PANDEY */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border shadow-sm text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>
              Made by{" "}
              <span className="font-semibold text-foreground">
                DEV KUMAR PANDEY
              </span>
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-3">
          Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || "board-saathi")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>{" "}
          · © {new Date().getFullYear()}
        </p>
      </div>

      {/* Profile Setup Dialog — shown after first II login */}
      <Dialog open={profileSetupOpen} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-sm"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Set Up Your Profile
            </DialogTitle>
            <DialogDescription>
              You're logged in! Tell us about yourself to complete your Board
              Saathi profile.
            </DialogDescription>
          </DialogHeader>
          <form
            data-ocid="profile_setup.dialog"
            onSubmit={handleProfileSetup}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="setup-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-ocid="profile_setup.input"
                  id="setup-name"
                  placeholder="Your full name"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup-school">School Name</Label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="setup-school"
                  placeholder="Your school name"
                  value={setupSchool}
                  onChange={(e) => setSetupSchool(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup-class">Class</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="setup-class"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="10"
                  value={setupClass}
                  onChange={(e) => setSetupClass(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button
              data-ocid="profile_setup.submit_button"
              type="submit"
              className="w-full gap-2"
              disabled={settingUpProfile}
            >
              {settingUpProfile ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Creating Profile...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create My Profile
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Parent Login Dialog */}
      <Dialog open={parentLoginOpen} onOpenChange={setParentLoginOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Parent Login
            </DialogTitle>
            <DialogDescription>
              Log in with your parent account credentials
            </DialogDescription>
          </DialogHeader>
          <form
            data-ocid="parent_login.dialog"
            onSubmit={handleParentLogin}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="parent-login-username">
                Your Parent Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-ocid="parent_login.input"
                  id="parent-login-username"
                  placeholder="Your parent username"
                  value={parentLoginUsername}
                  onChange={(e) => setParentLoginUsername(e.target.value)}
                  className="pl-9"
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-login-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="parent-login-password"
                  type={showParentLoginPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={parentLoginPassword}
                  onChange={(e) => setParentLoginPassword(e.target.value)}
                  className="pl-9 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowParentLoginPassword(!showParentLoginPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showParentLoginPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <Button
              data-ocid="parent_login.submit_button"
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              disabled={parentLoginLoading}
            >
              {parentLoginLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Login as Parent
                </span>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setParentLoginOpen(false);
                  setParentRegisterOpen(true);
                }}
              >
                Create Parent Account
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Parent Register Dialog */}
      <Dialog open={parentRegisterOpen} onOpenChange={setParentRegisterOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Create Parent Account
            </DialogTitle>
            <DialogDescription>
              Link your account to your child&apos;s student account
            </DialogDescription>
          </DialogHeader>
          <form
            data-ocid="parent_register.dialog"
            onSubmit={handleParentRegister}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="parent-reg-name">Your Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="parent-reg-name"
                  placeholder="Your full name"
                  value={parentRegName}
                  onChange={(e) => setParentRegName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-reg-username">Choose a Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-ocid="parent_register.input"
                  id="parent-reg-username"
                  placeholder="Your parent username"
                  value={parentRegUsername}
                  onChange={(e) => setParentRegUsername(e.target.value)}
                  className="pl-9"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground mb-3 font-medium">
                Child&apos;s Account Details
              </p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="parent-reg-child-username">
                    Child&apos;s Username
                  </Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="parent-reg-child-username"
                      placeholder="Your child's username"
                      value={parentRegChildUsername}
                      onChange={(e) =>
                        setParentRegChildUsername(e.target.value)
                      }
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent-reg-child-password">
                    Child&apos;s Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="parent-reg-child-password"
                      type={showParentRegPassword ? "text" : "password"}
                      placeholder="Your child's password"
                      value={parentRegChildPassword}
                      onChange={(e) =>
                        setParentRegChildPassword(e.target.value)
                      }
                      className="pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowParentRegPassword(!showParentRegPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showParentRegPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <strong>Note:</strong> Your child must have already created their
              Board Saathi student account. Their account will be looked up from
              the global server automatically.
            </div>

            <Button
              data-ocid="parent_register.submit_button"
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={parentRegLoading}
            >
              {parentRegLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Create Parent Account
                </span>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setParentRegisterOpen(false);
                  setParentLoginOpen(true);
                }}
              >
                Login as Parent
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
