import { useEffect, useState } from "react";
import { PRAYER_SETTINGS_EVENT, loadPrayerSettings, type PrayerSettings } from "./prayer-times";

/** Re-renders when the prayer city / method changes. */
export function usePrayerSettings(): PrayerSettings & { version: number } {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(PRAYER_SETTINGS_EVENT, bump);
    return () => window.removeEventListener(PRAYER_SETTINGS_EVENT, bump);
  }, []);
  return { ...loadPrayerSettings(), version };
}
