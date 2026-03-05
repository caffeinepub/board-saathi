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
import { useNavigate } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  Globe,
  GraduationCap,
  Lock,
  LogIn,
  School,
  ShieldCheck,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import {
  type ParentSession,
  type StoredUserAccount,
  findAccountsBySchool,
  getParentAccount,
  initializeUserData,
  isUsernameAvailable,
  parentLogin,
  saveParentAccountDirect,
  saveUserAccount,
  setCurrentUserId,
  setParentSession,
  simpleHash,
  updateUserPassword,
  validateCredentials,
} from "../utils/localStorageService";
import { pullAllData } from "../utils/syncService";

type Mode = "login" | "register";

export default function LoginPage() {
  const navigate = useNavigate();
  const { actor } = useActor();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regSchool, setRegSchool] = useState("");
  const [regClass, setRegClass] = useState("10");

  // Forgot password
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotSchool, setForgotSchool] = useState("");
  const [forgotResults, setForgotResults] = useState<StoredUserAccount[]>([]);
  const [forgotSearched, setForgotSearched] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);

  // Parent login dialog
  const [parentLoginOpen, setParentLoginOpen] = useState(false);
  const [parentLoginUsername, setParentLoginUsername] = useState("");
  const [parentLoginPassword, setParentLoginPassword] = useState("");
  const [showParentLoginPassword, setShowParentLoginPassword] = useState(false);
  const [parentLoginLoading, setParentLoginLoading] = useState(false);

  // Parent register dialog
  const [parentRegisterOpen, setParentRegisterOpen] = useState(false);
  const [parentRegUsername, setParentRegUsername] = useState("");
  const [parentRegName, setParentRegName] = useState("");
  const [parentRegChildUsername, setParentRegChildUsername] = useState("");
  const [parentRegChildPassword, setParentRegChildPassword] = useState("");
  const [showParentRegPassword, setShowParentRegPassword] = useState(false);
  const [parentRegLoading, setParentRegLoading] = useState(false);

  // ─── Student Login ────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      toast.error("Please enter username and password");
      return;
    }
    setLoading(true);
    try {
      const username = loginUsername.trim();
      const hashedPassword = simpleHash(loginPassword);

      // Step 1: Check localStorage first (fast, offline-capable)
      const localAccount = validateCredentials(username, loginPassword);
      if (localAccount) {
        // Use username as stable userId so data is consistent across devices
        const stableUserId = `user_${localAccount.username}`;
        setCurrentUserId(stableUserId);
        initializeUserData(stableUserId);
        // Pull latest data from canister (non-blocking, best-effort)
        if (actor) {
          toast.info("Syncing your data...", { duration: 2000 });
          const syncTimeout = new Promise<void>((resolve) =>
            setTimeout(resolve, 5000),
          );
          await Promise.race([pullAllData(username, actor), syncTimeout]);
        }
        toast.success(`Welcome back, ${localAccount.name}!`);
        navigate({ to: "/" });
        return;
      }

      // Step 2: Not found locally — check the global backend server
      if (actor) {
        try {
          const backendStudent = await actor.getStudentByUsername(username);
          if (backendStudent) {
            // Verify password hash matches
            if (backendStudent.password.hash !== hashedPassword) {
              toast.error("Incorrect password. Please try again.");
              return;
            }
            // Account found on backend — save locally for offline use
            const account: StoredUserAccount = {
              userId: `user_${username}`,
              username: backendStudent.username,
              passwordHash: backendStudent.password.hash,
              name: backendStudent.name,
              school: backendStudent.school,
              studentClass: Number(backendStudent.studentClass),
              createdAt: Date.now(),
            };
            saveUserAccount(account);
            const stableUserId = `user_${username}`;
            setCurrentUserId(stableUserId);
            initializeUserData(stableUserId);
            // Pull all user data from canister
            toast.info("Syncing your data...", { duration: 2000 });
            const syncTimeout = new Promise<void>((resolve) =>
              setTimeout(resolve, 5000),
            );
            await Promise.race([pullAllData(username, actor), syncTimeout]);
            toast.success(
              `Welcome back, ${backendStudent.name}! Profile synced from server.`,
            );
            navigate({ to: "/" });
            return;
          }
          toast.error(
            "No account found with this username. Please register first.",
          );
        } catch {
          toast.error(
            "Invalid username or password. Could not reach server to verify.",
          );
        }
      } else {
        toast.error(
          "Account not found on this device. Please connect to the internet to sync your profile.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Student Registration ─────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !regUsername.trim() ||
      !regPassword.trim() ||
      !regName.trim() ||
      !regSchool.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (regPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    if (!isUsernameAvailable(regUsername.trim())) {
      toast.error("Username already taken. Please choose another.");
      return;
    }
    setLoading(true);
    try {
      const hashedPassword = simpleHash(regPassword);
      const studentClass = Number.parseInt(regClass, 10) || 10;

      // Try to register on the global backend server first
      if (actor) {
        try {
          await actor.registerStudent(
            regUsername.trim(),
            regName.trim(),
            regSchool.trim(),
            BigInt(studentClass),
            hashedPassword,
          );
          toast.success("Account saved to global server ✓");
        } catch (backendErr: unknown) {
          const errMsg =
            backendErr instanceof Error
              ? backendErr.message
              : String(backendErr);
          if (errMsg.includes("Username already taken")) {
            toast.error(
              "This username is already taken on the global server. Please choose another.",
            );
            return;
          }
          // Non-fatal: backend unavailable, continue with local-only
          toast.warning(
            "Could not reach global server. Account saved locally only — parents on other devices may not find it.",
          );
        }
      } else {
        toast.warning(
          "Server not available. Account saved locally only — parents on other devices may not find it.",
        );
      }

      // Save locally regardless (for offline use)
      // Use username-based stable userId so data is consistent across devices
      const stableUserId = `user_${regUsername.trim()}`;
      const account: StoredUserAccount = {
        userId: stableUserId,
        username: regUsername.trim(),
        passwordHash: hashedPassword,
        name: regName.trim(),
        school: regSchool.trim(),
        studentClass,
        createdAt: Date.now(),
      };
      saveUserAccount(account);
      setCurrentUserId(stableUserId);
      initializeUserData(stableUserId);
      toast.success(`Account created! Welcome, ${regName}!`);
      navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    setCurrentUserId("guest");
    initializeUserData("guest");
    toast.success(
      "Continuing as Guest. Your data will be cleared when you close the browser.",
    );
    navigate({ to: "/" });
  };

  const handleForgotSearch = () => {
    if (!forgotSchool.trim()) {
      toast.error("Please enter your school name");
      return;
    }
    const results = findAccountsBySchool(forgotSchool.trim());
    setForgotResults(results);
    setForgotSearched(true);
  };

  const handlePasswordReset = () => {
    if (!resetUsername || !resetNewPassword.trim()) {
      toast.error("Please select an account and enter a new password");
      return;
    }
    if (resetNewPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    const success = updateUserPassword(resetUsername, resetNewPassword);
    if (success) {
      setResetDone(true);
      toast.success("Password reset successfully!");
    } else {
      toast.error("Failed to reset password");
    }
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
        setParentSession(session);
        toast.success(`Welcome! Viewing ${session.childUsername}'s progress.`);
        setParentLoginOpen(false);
        navigate({ to: "/parent-dashboard" });
        return;
      }

      // Step 2: Not found locally — check backend (no auth required for getParentProfileByUsername)
      if (actor) {
        try {
          const backendParent =
            await actor.getParentProfileByUsername(pUsername);
          if (backendParent) {
            if (backendParent.password.hash !== hashedPassword) {
              toast.error("Incorrect password.");
              return;
            }
            // Save locally for offline use
            saveParentAccountDirect({
              parentUsername: backendParent.username,
              passwordHash: backendParent.password.hash,
              childUsername: backendParent.linkedStudentUsername,
              parentName: backendParent.name,
            });

            const session: ParentSession = {
              parentUsername: backendParent.username,
              childUsername: backendParent.linkedStudentUsername,
              parentName: backendParent.name,
            };
            setParentSession(session);
            toast.success(
              `Welcome! Viewing ${session.childUsername}'s progress. (Synced from server)`,
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
      const hashedParentPassword = hashedChildPassword; // parent uses child's password as their own

      let studentVerified = false;

      // Step 1: Verify student exists — check locally first, then backend
      if (actor) {
        try {
          const { getUserAccount } = await import(
            "../utils/localStorageService"
          );
          const localStudent = getUserAccount(childUsername);

          if (localStudent) {
            // Verify password matches locally
            if (localStudent.passwordHash !== hashedChildPassword) {
              toast.error(
                "Student's password is incorrect. Please ask your child for their correct password.",
              );
              return;
            }
            studentVerified = true;
          } else {
            // Not found locally — check the global backend server
            try {
              const backendStudent =
                await actor.getStudentByUsername(childUsername);
              if (backendStudent) {
                if (backendStudent.password.hash !== hashedChildPassword) {
                  toast.error(
                    "Student's password is incorrect. Please ask your child for their correct password.",
                  );
                  return;
                }
                // Save student locally for offline access
                const {
                  saveUserAccount: saveAcc,
                  initializeUserData: initData,
                } = await import("../utils/localStorageService");
                const syncedAccount: StoredUserAccount = {
                  userId: `user_${childUsername}`,
                  username: backendStudent.username,
                  passwordHash: backendStudent.password.hash,
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
                `No student account found with username "${childUsername}" on this device. Ask your child to log in on this device first, or check your internet connection.`,
              );
              return;
            }
          }

          if (studentVerified) {
            // Register parent on backend
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
              // Non-fatal backend error
              toast.warning(
                "Could not save to global server. Account saved locally only.",
              );
            }
          }
        } catch {
          // Backend unreachable
          toast.warning(
            "Server not available. Proceeding with local registration only.",
          );
        }
      }

      // Step 2: Save locally (always) — use direct save since we already verified the student above
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/generated/board-saathi-logo.dim_256x256.png"
              alt="Board Saathi"
              className="w-20 h-20 rounded-2xl shadow-lg object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.src = "/assets/generated/app-icon-192.dim_192x192.png";
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Board Saathi</h1>
          <p className="text-muted-foreground mt-1">
            Your CBSE Class 10 Companion
          </p>
          {actor && (
            <div className="flex items-center justify-center gap-1 mt-1 text-xs text-emerald-600">
              <Globe className="w-3 h-3" />
              <span>Connected to global server</span>
            </div>
          )}
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="pb-2">
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  mode === "login"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  mode === "register"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Register
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="pl-9"
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-9 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Logging in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Login
                    </span>
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="w-full text-sm text-primary hover:underline text-center"
                >
                  Forgot password?
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                {actor && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      Your account will be saved to the global server so parents
                      can find you from any device.
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-name"
                      placeholder="Your full name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-username"
                      placeholder="Choose a username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="pl-9"
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 4 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="pl-9 pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-school">School Name</Label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-school"
                      placeholder="Your school name"
                      value={regSchool}
                      onChange={(e) => setRegSchool(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-class">Class</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-class"
                      type="number"
                      min="1"
                      max="12"
                      placeholder="10"
                      value={regClass}
                      onChange={(e) => setRegClass(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Create Account
                    </span>
                  )}
                </Button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mb-3"
              onClick={handleGuestMode}
            >
              Continue as Guest
            </Button>

            {/* Parent Portal */}
            <div className="relative my-4">
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
                variant="outline"
                className="w-full justify-start gap-2 border-amber-500/40 text-amber-700 hover:bg-amber-50 hover:border-amber-500"
                onClick={() => setParentLoginOpen(true)}
              >
                <Users className="w-4 h-4" />
                Login as Parent
              </Button>
              <Button
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

        <p className="text-center text-xs text-muted-foreground mt-6">
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

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              Find your account by school name
            </DialogDescription>
          </DialogHeader>
          {!resetDone ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>School Name</Label>
                <Input
                  placeholder="Enter your school name"
                  value={forgotSchool}
                  onChange={(e) => setForgotSchool(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleForgotSearch}>
                Search Accounts
              </Button>
              {forgotSearched && (
                <div className="space-y-2">
                  {forgotResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center">
                      No accounts found for this school.
                    </p>
                  ) : (
                    <>
                      <Label>Select your account</Label>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {forgotResults.map((acc) => (
                          <button
                            type="button"
                            key={acc.username}
                            onClick={() => setResetUsername(acc.username)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              resetUsername === acc.username
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                          >
                            {acc.name} (@{acc.username})
                          </button>
                        ))}
                      </div>
                      {resetUsername && (
                        <div className="space-y-2 pt-2">
                          <Label>New Password</Label>
                          <Input
                            type="password"
                            placeholder="Min. 4 characters"
                            value={resetNewPassword}
                            onChange={(e) =>
                              setResetNewPassword(e.target.value)
                            }
                          />
                          <Button
                            className="w-full"
                            onClick={handlePasswordReset}
                          >
                            Reset Password
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3 py-4">
              <p className="text-emerald-600 font-medium">
                Password reset successfully!
              </p>
              <Button
                onClick={() => {
                  setForgotOpen(false);
                  setResetDone(false);
                  setForgotSchool("");
                  setForgotResults([]);
                  setForgotSearched(false);
                  setResetUsername("");
                  setResetNewPassword("");
                }}
              >
                Back to Login
              </Button>
            </div>
          )}
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
          <form onSubmit={handleParentLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parent-login-username">
                Your Parent Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
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
              Don't have an account?{" "}
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
              Link your account to your child's student account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleParentRegister} className="space-y-4">
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
                Child's Account Details
              </p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="parent-reg-child-username">
                    Child's Username
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
                    Child's Password
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
