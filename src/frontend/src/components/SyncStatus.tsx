import { useEffect, useState } from "react";
import {
  type SyncStatus as SyncStatusType,
  getSyncStatus,
} from "../utils/syncService";

/**
 * SyncStatus — small indicator showing whether data is synced, pending, or offline.
 * Designed to be rendered in the sidebar bottom area and mobile top bar.
 */
export default function SyncStatus() {
  const [status, setStatus] = useState<SyncStatusType>(getSyncStatus());

  useEffect(() => {
    // Refresh status every 2 seconds
    const interval = setInterval(() => {
      setStatus(getSyncStatus());
    }, 2000);

    // Also update immediately when online/offline changes
    const handleOnline = () => setStatus(getSyncStatus());
    const handleOffline = () => setStatus("offline");
    // Update when data changes or sync status changes
    const handleDataChanged = () => setStatus(getSyncStatus());
    const handleStatusChanged = () => setStatus(getSyncStatus());

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("bs:data-changed", handleDataChanged);
    window.addEventListener("bs:sync-status-changed", handleStatusChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("bs:data-changed", handleDataChanged);
      window.removeEventListener("bs:sync-status-changed", handleStatusChanged);
    };
  }, []);

  if (status === "offline") {
    return (
      <div
        data-ocid="sync.status"
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground"
        title="You are offline. Changes will sync when reconnected."
      >
        <span className="w-2 h-2 rounded-full bg-muted-foreground/60 flex-shrink-0" />
        <span>Offline</span>
      </div>
    );
  }

  if (status === "pulling") {
    return (
      <div
        data-ocid="sync.status"
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-blue-600"
        title="Downloading your data from the server..."
      >
        <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 animate-pulse" />
        <span>Loading data…</span>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div
        data-ocid="sync.status"
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-amber-600"
        title="Saving your changes to the server..."
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
        <span>Saving…</span>
      </div>
    );
  }

  return (
    <div
      data-ocid="sync.status"
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-emerald-600"
      title="All data is synced to the server."
    >
      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      <span>Synced</span>
    </div>
  );
}
