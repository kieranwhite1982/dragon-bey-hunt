import { useEffect, useRef } from 'react';

/* Release is detected on WINDOW, never on the element.

   The original bug: onPointerLeave on the hold button plus a CSS scale
   transform on that same button. Pressing it shrank the element out from
   under the finger, which fired a phantom leave the instant it was touched,
   so the progress bar never moved. Listening on window means the hold
   survives the finger drifting, the element resizing, or the browser
   reflowing mid-press. */
export function useGlobalRelease(onRelease) {
  const ref = useRef(onRelease);
  useEffect(() => {
    ref.current = onRelease;
  }, [onRelease]);

  useEffect(() => {
    const f = () => ref.current();
    const events = ['pointerup', 'pointercancel', 'touchend', 'touchcancel', 'blur'];
    events.forEach((e) => window.addEventListener(e, f));
    return () => events.forEach((e) => window.removeEventListener(e, f));
  }, []);
}

export default useGlobalRelease;
