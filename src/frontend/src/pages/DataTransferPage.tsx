import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { getCurrentUserId, getIIPrincipal } from "../utils/localStorageService";
import {
  SYNC_DATA_TYPES,
  pullAllData,
  pushAllLocalData,
} from "../utils/syncService";

// ─── Helper: build a full data bundle from localStorage ─────────────────────

function buildExportBundle(userId: string): Record<string, unknown> {
  const bundle: Record<string, unknown> = {};
  for (const dataType of SYNC_DATA_TYPES) {
    const key = `bs_${userId}_${dataType}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        bundle[dataType] = JSON.parse(raw);
      } catch {
        bundle[dataType] = raw;
      }
    }
  }
  // Also capture wordBooster with its special key
  const wbKey = `wordBooster_${userId}`;
  const wbRaw = localStorage.getItem(wbKey);
  if (wbRaw) {
    try {
      bundle.wordBooster = JSON.parse(wbRaw);
    } catch {
      bundle.wordBooster = wbRaw;
    }
  }
  // Also capture profile account
  const accountKeys = Object.keys(localStorage).filter(
    (k) => k.startsWith("bs_accounts") || k === `bs_user_${userId}`,
  );
  for (const k of accountKeys) {
    const raw = localStorage.getItem(k);
    if (raw) {
      try {
        bundle[`__ls_${k}`] = JSON.parse(raw);
      } catch {
        bundle[`__ls_${k}`] = raw;
      }
    }
  }
  return bundle;
}

function restoreBundle(userId: string, bundle: Record<string, unknown>): void {
  for (const dataType of SYNC_DATA_TYPES) {
    if (dataType in bundle) {
      const key = `bs_${userId}_${dataType}`;
      localStorage.setItem(key, JSON.stringify(bundle[dataType]));
    }
  }
  if ("wordBooster" in bundle) {
    localStorage.setItem(
      `wordBooster_${userId}`,
      JSON.stringify(bundle.wordBooster),
    );
  }
  // Restore raw ls keys
  for (const [k, v] of Object.entries(bundle)) {
    if (k.startsWith("__ls_")) {
      const realKey = k.slice(5);
      localStorage.setItem(realKey, JSON.stringify(v));
    }
  }
}

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DataTransferPage() {
  const { actor } = useActor();
  const userId = getCurrentUserId();
  const iiPrincipal = getIIPrincipal();
  const isGuest = !userId || userId === "guest";

  // ── Export / Import state
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── PIN state
  const [activePin, setActivePin] = useState<string | null>(null);
  const [pinExpiry, setPinExpiry] = useState<number | null>(null);
  const [generatingPin, setGeneratingPin] = useState(false);
  const [enterPin, setEnterPin] = useState("");
  const [fetchingPin, setFetchingPin] = useState(false);

  // ── Export: download JSON file
  const handleExport = async () => {
    if (isGuest || !userId) {
      toast.error("Login required to export data.");
      return;
    }
    setExporting(true);
    try {
      const bundle = buildExportBundle(userId);
      const payload = JSON.stringify(
        {
          version: "2.0",
          appName: "Board Saathi",
          exportedAt: new Date().toISOString(),
          userId,
          iiPrincipal: iiPrincipal || null,
          data: bundle,
        },
        null,
        2,
      );
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `board-saathi-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported! File downloaded to your device.");
    } catch (err) {
      toast.error("Export failed. Please try again.");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  // ── Import: read JSON file and restore
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!userId) {
      toast.error("Login required to import data.");
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.data || parsed.appName !== "Board Saathi") {
        toast.error("Invalid file. Please use a Board Saathi backup file.");
        return;
      }
      restoreBundle(userId, parsed.data as Record<string, unknown>);
      // Push restored data to canister
      if (actor) {
        await pushAllLocalData(userId, actor);
        toast.success("Data imported and synced to server!");
      } else {
        toast.success("Data imported! It will sync to server when online.");
      }
      // Notify all components
      window.dispatchEvent(new CustomEvent("bs:data-pulled"));
    } catch (err) {
      toast.error("Failed to read file. Make sure it is a valid backup.");
      console.error(err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Generate PIN: push data to canister under a temporary PIN key
  const handleGeneratePin = async () => {
    if (isGuest || !userId || !actor) {
      toast.error("Must be online and logged in to generate a PIN.");
      return;
    }
    setGeneratingPin(true);
    try {
      const pin = generatePin();
      // Build the data bundle and push it to the canister under key __transfer_{pin}
      const bundle = buildExportBundle(userId);
      const payload = JSON.stringify({
        version: "2.0",
        appName: "Board Saathi",
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        data: bundle,
      });
      await actor.saveMyData(`__transfer_${pin}`, payload);
      setActivePin(pin);
      setPinExpiry(Date.now() + 10 * 60 * 1000);
      toast.success("PIN generated! Valid for 10 minutes.");

      // Auto-clear after 10 minutes
      setTimeout(
        () => {
          setActivePin(null);
          setPinExpiry(null);
        },
        10 * 60 * 1000,
      );
    } catch (err) {
      toast.error("Failed to generate PIN. Check your connection.");
      console.error(err);
    } finally {
      setGeneratingPin(false);
    }
  };

  // ── Use PIN: fetch from canister and restore
  const handleUsePinTransfer = async () => {
    if (!enterPin || enterPin.length !== 6) {
      toast.error("Enter a valid 6-digit PIN.");
      return;
    }
    if (isGuest || !userId || !actor) {
      toast.error("Must be online and logged in to receive data.");
      return;
    }
    setFetchingPin(true);
    try {
      const raw = await actor.getMyData(`__transfer_${enterPin}`);
      if (!raw || raw.trim() === "") {
        toast.error(
          "PIN not found or expired. Ask the sender to generate a new PIN.",
        );
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed.appName !== "Board Saathi" || !parsed.data) {
        toast.error("Invalid PIN data.");
        return;
      }
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        toast.error(
          "This PIN has expired. Ask the sender to generate a new one.",
        );
        return;
      }
      restoreBundle(userId, parsed.data as Record<string, unknown>);
      if (actor) {
        await pushAllLocalData(userId, actor);
      }
      window.dispatchEvent(new CustomEvent("bs:data-pulled"));
      toast.success(
        "Data transferred successfully! All your data is now on this device.",
      );
      setEnterPin("");
    } catch (err) {
      toast.error("Transfer failed. Check the PIN and try again.");
      console.error(err);
    } finally {
      setFetchingPin(false);
    }
  };

  const pinMinutesLeft = pinExpiry
    ? Math.max(0, Math.round((pinExpiry - Date.now()) / 60000))
    : null;

  return (
    <div className="p-4 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Data Transfer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Move your full profile to another device — 3 ways to do it.
        </p>
      </div>

      {/* ── Method 1: Export / Import File ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-bold">
              1
            </span>
            Export / Import File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download your entire profile as a <strong>.json</strong> file. Copy
            it to another device and import it there. Works offline — no
            internet needed.
          </p>

          <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1 text-muted-foreground">
            <p>
              📲 <strong>How it works:</strong>
            </p>
            <p>
              1. On <strong>this device</strong> → tap <em>Export Data</em> →
              file downloads.
            </p>
            <p>
              2. Move the file to your other phone/laptop (WhatsApp, Email, USB,
              etc.)
            </p>
            <p>
              3. On the <strong>other device</strong> → tap <em>Import Data</em>{" "}
              → select the file → done!
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleExport}
              disabled={exporting || isGuest}
            >
              {exporting ? "Exporting..." : "⬇ Export Data"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing || isGuest}
            >
              {importing ? "Importing..." : "⬆ Import Data"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
          {isGuest && (
            <p className="text-xs text-amber-600 text-center">
              Login required to use export/import.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Method 2: Transfer PIN ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center justify-center text-sm font-bold">
              2
            </span>
            Transfer via PIN
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a 6-digit PIN on this device. Open the app on your other
            device, enter the PIN, and your full data transfers instantly. Needs
            internet on both devices.
          </p>

          <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1 text-muted-foreground">
            <p>
              📲 <strong>How it works:</strong>
            </p>
            <p>
              1. On <strong>this device</strong> → tap <em>Generate PIN</em>.
            </p>
            <p>
              2. Open the app on your <strong>other device</strong>, login with
              Internet Identity.
            </p>
            <p>
              3. Go to <em>Data Transfer</em> → enter the PIN → tap{" "}
              <em>Receive Data</em>.
            </p>
            <p>4. All your data appears on the other device in seconds!</p>
            <p className="text-amber-600">⏱ PIN expires in 10 minutes.</p>
          </div>

          {/* Generate PIN section */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Step A — Generate PIN (on this device)
            </p>
            {activePin ? (
              <div className="text-center space-y-3 p-4 bg-green-50 dark:bg-green-950 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-xs text-muted-foreground">
                  Your transfer PIN (valid ~{pinMinutesLeft} min):
                </p>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((pos) => (
                    <div
                      key={`pin-pos-${pos}`}
                      className="w-12 h-14 flex items-center justify-center text-3xl font-black bg-white dark:bg-black rounded-lg border-2 border-green-400 dark:border-green-600 shadow-sm"
                    >
                      {activePin[pos] ?? ""}
                    </div>
                  ))}
                </div>
                {/* QR Code */}
                <div className="flex justify-center mt-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=BOARDSAATHI-${activePin}&bgcolor=ffffff&color=000000&margin=4`}
                    alt={`QR code for PIN ${activePin}`}
                    className="w-40 h-40 rounded-lg border border-border"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this PIN (or scan the QR) on your other device.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActivePin(null);
                    setPinExpiry(null);
                  }}
                >
                  Clear PIN
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handleGeneratePin}
                disabled={generatingPin || isGuest || !actor}
              >
                {generatingPin ? "Generating..." : "Generate PIN"}
              </Button>
            )}
            {!actor && !isGuest && (
              <p className="text-xs text-amber-600 text-center">
                Waiting for server connection...
              </p>
            )}
          </div>

          {/* Enter PIN section */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-sm font-semibold">
              Step B — Enter PIN (on the other device)
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter 6-digit PIN"
                value={enterPin}
                onChange={(e) =>
                  setEnterPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                className="text-center text-lg font-bold tracking-widest"
                inputMode="numeric"
              />
              <Button
                onClick={handleUsePinTransfer}
                disabled={
                  fetchingPin || enterPin.length !== 6 || isGuest || !actor
                }
                className="shrink-0"
              >
                {fetchingPin ? "Receiving..." : "Receive Data"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Method 3: Internet Identity (already works) ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center text-sm font-bold">
              3
            </span>
            Login with Internet Identity (Auto)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The easiest method — just login with your Internet Identity on the
            new device. Your data syncs automatically within seconds. No PIN, no
            file needed.
          </p>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground mt-3 space-y-1">
            <p>
              📲 <strong>How it works:</strong>
            </p>
            <p>1. Open the app on the other device.</p>
            <p>
              2. Tap <em>Login with Internet Identity</em>.
            </p>
            <p>3. Use the same identity — your data loads automatically.</p>
            <p className="text-green-600 font-semibold">
              ✓ Already set up — no extra steps needed!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
