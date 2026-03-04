import { Download, Smartphone, X } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

export default function PWAInstallBanner() {
  const { showBanner, dismissBanner, installPrompt } = usePWAInstall();

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-primary text-primary-foreground rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-primary/20">
        {/* Icon */}
        <div className="flex-shrink-0">
          <img
            src="/assets/generated/board-saathi-icon-192.dim_192x192.png"
            alt="Board Saathi"
            className="w-12 h-12 rounded-xl shadow-md"
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">
            Install Board Saathi
          </p>
          <p className="text-xs text-primary-foreground/80 mt-0.5 leading-tight">
            Add to home screen for quick access
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={installPrompt}
            className="flex items-center gap-1.5 bg-primary-foreground text-primary text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary-foreground/90 transition-colors"
            aria-label="Install app"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Install
          </button>
          <button
            type="button"
            onClick={dismissBanner}
            className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors"
            aria-label="Dismiss install banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
