import { useEffect } from 'react';

/* Ten minutes of running around the house with the phone in a pocket is
   plenty of time for the screen to lock. Where the API exists, hold the
   screen awake; where it doesn't, do nothing and never throw. */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    if (typeof navigator === 'undefined' || !navigator.wakeLock) return undefined;

    let lock = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        /* denied, or the tab is not visible — harmless */
      }
    };

    const onVisible = () => {
      if (!cancelled && document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      try {
        if (lock) lock.release();
      } catch {
        /* noop */
      }
    };
  }, [active]);
}

export default useWakeLock;
