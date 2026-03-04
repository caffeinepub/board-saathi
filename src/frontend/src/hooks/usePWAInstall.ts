import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface UsePWAInstallReturn {
  canInstall: boolean;
  isInstalled: boolean;
  showBanner: boolean;
  dismissBanner: () => void;
  installPrompt: () => Promise<void>;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("pwa-banner-dismissed") === "true";
    } catch {
      return false;
    }
  });

  const isInstalled =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Listen for app installed event
  useEffect(() => {
    const handler = () => {
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);

  const dismissBanner = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem("pwa-banner-dismissed", "true");
    } catch {
      // ignore
    }
  }, []);

  const installPrompt = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        setDismissed(true);
      }
    } catch (err) {
      console.warn("[PWA] Install prompt failed:", err);
    }
  }, [deferredPrompt]);

  const canInstall = !!deferredPrompt && !isInstalled;
  const showBanner = canInstall && !dismissed;

  return { canInstall, isInstalled, showBanner, dismissBanner, installPrompt };
}
