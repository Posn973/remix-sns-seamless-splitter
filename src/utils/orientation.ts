/**
 * Screen Orientation Lock / Unlock Helper
 * Safe for Android, iOS, and PC browsers.
 * Note: Chrome/Android requires entering Fullscreen mode to lock screen orientation.
 */

export async function requestFullscreenAndLockPortrait(element?: HTMLElement): Promise<boolean> {
  try {
    const targetElement = element || document.documentElement;

    // 1. Request Fullscreen first (required by browser spec for orientation lock)
    if (!document.fullscreenElement) {
      if (typeof targetElement.requestFullscreen === 'function') {
        try {
          await targetElement.requestFullscreen();
        } catch (fsErr) {
          // Fullscreen might fail in iframe or user policy, proceed to try orientation
        }
      } else if ((targetElement as any).webkitRequestFullscreen) {
        try {
          await (targetElement as any).webkitRequestFullscreen();
        } catch (fsErr) {}
      }
    }

    // 2. Lock screen orientation
    if (typeof window !== 'undefined' && window.screen && 'orientation' in window.screen) {
      const orientation = window.screen.orientation as any;
      if (orientation && typeof orientation.lock === 'function') {
        try {
          await orientation.lock('portrait');
          return true;
        } catch (e1) {
          try {
            await orientation.lock('portrait-primary');
            return true;
          } catch (e2) {
            // Lock rejected
          }
        }
      }
    }

    // Legacy vendor prefixes
    const legacyScreen = typeof window !== 'undefined' ? (window.screen as any) : null;
    if (legacyScreen) {
      if (typeof legacyScreen.lockOrientation === 'function') {
        legacyScreen.lockOrientation('portrait');
        return true;
      }
      if (typeof legacyScreen.mozLockOrientation === 'function') {
        legacyScreen.mozLockOrientation('portrait');
        return true;
      }
      if (typeof legacyScreen.msLockOrientation === 'function') {
        legacyScreen.msLockOrientation('portrait');
        return true;
      }
    }
  } catch (err) {
    // Silently fail on unsupported environments
  }
  return false;
}

export async function exitFullscreenAndUnlock(): Promise<void> {
  try {
    // 1. Unlock screen orientation
    if (typeof window !== 'undefined' && window.screen && 'orientation' in window.screen) {
      const orientation = window.screen.orientation as any;
      if (orientation && typeof orientation.unlock === 'function') {
        orientation.unlock();
      }
    }

    const legacyScreen = typeof window !== 'undefined' ? (window.screen as any) : null;
    if (legacyScreen) {
      if (typeof legacyScreen.unlockOrientation === 'function') {
        legacyScreen.unlockOrientation();
      } else if (typeof legacyScreen.mozUnlockOrientation === 'function') {
        legacyScreen.mozUnlockOrientation();
      } else if (typeof legacyScreen.msUnlockOrientation === 'function') {
        legacyScreen.msUnlockOrientation();
      }
    }

    // 2. Exit fullscreen if active
    if (document.fullscreenElement) {
      if (typeof document.exitFullscreen === 'function') {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    }
  } catch (err) {
    // Silently fail
  }
}

