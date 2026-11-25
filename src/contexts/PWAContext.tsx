import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export interface VersionInfo {
  version: string;
  appHash: string;
  buildTime: number;
}

const STORAGE_HASH_KEY = 'sns_splitter_cached_hash';
const STORAGE_VERSION_KEY = 'sns_splitter_cached_version';
const STORAGE_LAST_CHECK_TIME_KEY = 'sns_splitter_last_hash_check_time';
const STORAGE_MANUAL_CHECK_KEY = 'sns_splitter_manual_check_timestamp';

// 24 hours in milliseconds
const AUTO_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
// 30 seconds manual cooldown
const MANUAL_COOLDOWN_SECONDS = 30;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PWAContextValue {
  isOnline: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  needRefresh: boolean;
  isCheckingUpdate: boolean;
  isUpdating: boolean;
  lastCheckMessage: string | null;
  lastCheckTime: number | null;
  cooldownRemaining: number;
  manualCooldownSeconds: number;
  autoIntervalHours: number;
  latestVersion: VersionInfo | null;
  checkForUpdate: (manual?: boolean) => Promise<void>;
  installApp: () => Promise<boolean>;
  reloadToUpdate: () => Promise<void>;
  dismissUpdateNotice: () => void;
}

const PWAContext = createContext<PWAContextValue | null>(null);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [latestVersion, setLatestVersion] = useState<VersionInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_LAST_CHECK_TIME_KEY);
    return saved ? Number(saved) : null;
  });

  const swRegistrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);

  // Calculate initial cooldown remaining
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(() => {
    const lastManual = localStorage.getItem(STORAGE_MANUAL_CHECK_KEY);
    if (!lastManual) return 0;
    const diffSec = Math.floor((Date.now() - Number(lastManual)) / 1000);
    return diffSec < MANUAL_COOLDOWN_SECONDS ? MANUAL_COOLDOWN_SECONDS - diffSec : 0;
  });

  // Cooldown countdown interval
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Register Service Worker with prompt mode
  const {
    needRefresh: [swNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      swRegistrationRef.current = r;
      // Periodically check for SW update every 60 minutes
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('SW registration error:', error);
    },
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Track install prompt and standalone mode
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Check SHA-256 Hash against server's version.json
  const checkForUpdate = useCallback(async (manual = false) => {
    if (!navigator.onLine) {
      if (manual) setLastCheckMessage('オフラインのため確認をスキップしました');
      return;
    }

    // Manual check: enforce 30-second cooldown
    if (manual) {
      const lastManual = localStorage.getItem(STORAGE_MANUAL_CHECK_KEY);
      if (lastManual) {
        const elapsedSec = (Date.now() - Number(lastManual)) / 1000;
        if (elapsedSec < MANUAL_COOLDOWN_SECONDS) {
          const rem = Math.ceil(MANUAL_COOLDOWN_SECONDS - elapsedSec);
          setCooldownRemaining(rem);
          return;
        }
      }

      // Start 30s cooldown
      localStorage.setItem(STORAGE_MANUAL_CHECK_KEY, String(Date.now()));
      setCooldownRemaining(MANUAL_COOLDOWN_SECONDS);
    } else {
      // Automatic check: only check if 24 hours have elapsed since the last check
      const savedLastTime = localStorage.getItem(STORAGE_LAST_CHECK_TIME_KEY);
      if (savedLastTime) {
        const elapsed = Date.now() - Number(savedLastTime);
        if (elapsed < AUTO_CHECK_INTERVAL_MS) {
          return;
        }
      }
    }

    try {
      setIsCheckingUpdate(true);

      // Also ask Service Worker to check for updates when manual check is triggered
      if (manual && swRegistrationRef.current) {
        try {
          await swRegistrationRef.current.update();
        } catch {
          // ignore SW update check error
        }
      }

      // Fetch version.json bypassing browser cache
      const response = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        if (manual) setLastCheckMessage('バージョン情報の取得に失敗しました');
        return;
      }

      const data: VersionInfo = await response.json();
      setLatestVersion(data);

      // Record successful check time
      const now = Date.now();
      localStorage.setItem(STORAGE_LAST_CHECK_TIME_KEY, String(now));
      setLastCheckTime(now);

      const cachedHash = localStorage.getItem(STORAGE_HASH_KEY);

      if (!cachedHash) {
        // First run: save the current hash
        localStorage.setItem(STORAGE_HASH_KEY, data.appHash);
        localStorage.setItem(STORAGE_VERSION_KEY, data.version);
        if (manual) setLastCheckMessage('お使いのバージョンは最新です');
      } else if (cachedHash !== data.appHash) {
        // Hash mismatch! Server has updated code
        setNeedRefresh(true);
        if (manual) setLastCheckMessage(`新しいバージョン (v${data.version}) を検出しました`);
      } else {
        // Same hash: stay on cache
        if (manual) setLastCheckMessage('お使いのバージョンは最新です');
      }
    } catch (e) {
      console.warn('[PWA] Failed to check version hash:', e);
      if (manual) setLastCheckMessage('通信エラーのため確認できませんでした');
    } finally {
      setIsCheckingUpdate(false);
    }
  }, []);

  // Trigger lightweight hash check on startup (throttled to 24h)
  useEffect(() => {
    checkForUpdate(false);
  }, [checkForUpdate]);

  // If Workbox SW detects new content, also trigger needRefresh
  useEffect(() => {
    if (swNeedRefresh) {
      setNeedRefresh(true);
    }
  }, [swNeedRefresh]);

  // Install app action
  const installApp = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  // Perform update: write new hash to storage, update SW, and reload cleanly
  const reloadToUpdate = useCallback(async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      if (latestVersion?.appHash) {
        localStorage.setItem(STORAGE_HASH_KEY, latestVersion.appHash);
        localStorage.setItem(STORAGE_VERSION_KEY, latestVersion.version);
      }

      if (swRegistrationRef.current) {
        try {
          await swRegistrationRef.current.update();
        } catch {
          // ignore
        }
      }

      await updateServiceWorker(true);

      // Fallback: if updateServiceWorker(true) did not trigger an immediate reload
      // (e.g., when hash mismatch was detected before SW entered waiting state),
      // force a clean reload after a short delay.
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (e) {
      console.error('[PWA] Update failed, forcing reload:', e);
      window.location.reload();
    }
  }, [isUpdating, latestVersion, updateServiceWorker]);

  const dismissUpdateNotice = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        isInstalled,
        isInstallable: !!deferredPrompt,
        isIOS,
        needRefresh,
        isCheckingUpdate,
        isUpdating,
        lastCheckMessage,
        lastCheckTime,
        cooldownRemaining,
        manualCooldownSeconds: MANUAL_COOLDOWN_SECONDS,
        autoIntervalHours: 24,
        latestVersion,
        checkForUpdate,
        installApp,
        reloadToUpdate,
        dismissUpdateNotice,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export function usePWAContext(): PWAContextValue {
  const ctx = useContext(PWAContext);
  if (!ctx) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return ctx;
}
