
/* A stable origin means localStorage actually survives between visits, which
   is one of the reasons for moving off the artifact. If the phone locks or
   the browser evicts the tab mid-hunt, the title screen offers a resume
   instead of restarting from part 1 with three presents already unwrapped. */

const KEY = 'dbh.save.v2';

export function loadRun() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || typeof v.stageIdx !== 'number' || !Array.isArray(v.parts)) return null;
    if (v.screen !== 'hunt' && v.screen !== 'battle') return null;
    return v;
  } catch {
    return null;
  }
}

export function saveRun(v) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* private mode / quota — the hunt still works, it just can't resume */
  }
}

export function clearRun() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

