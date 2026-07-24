import { useCallback, useEffect, useState } from 'react';
import {
  BATTLE_FINISH,
  BEY_ASSEMBLED,
  IGNIS_INTRO,
  IGNIS_PORTRAIT,
  IGNIS_VICTORY,
  PART_IMAGES,
  SCRIPT_VIDEOS,
  WYRM_PORTRAIT,
  WYRM_SMASH,
} from '../optionalAssets.js';

/* The whole app exists to survive a garage with no wifi, but until now the
   only way to know whether the media actually made it onto the phone was to
   walk into the garage and find out. This asks the Cache Storage API
   directly, so the parent panel can answer it the night before.

   Only the heavy media is checked. The app shell is a few hundred KB and is
   cached long before any of this; the clips are the part that plausibly
   fails on a flaky connection. */
function mediaUrls() {
  return [
    ...Object.values(SCRIPT_VIDEOS),
    ...Object.values(PART_IMAGES),
    IGNIS_INTRO,
    IGNIS_VICTORY,
    IGNIS_PORTRAIT,
    WYRM_SMASH,
    WYRM_PORTRAIT,
    BEY_ASSEMBLED,
    BATTLE_FINISH,
  ].filter(Boolean);
}

export default function useOfflineReady(active) {
  const [state, setState] = useState({ status: 'idle', total: 0, cached: 0, missing: [] });

  const check = useCallback(async () => {
    const urls = mediaUrls();
    if (!urls.length) {
      setState({ status: 'none', total: 0, cached: 0, missing: [] });
      return;
    }
    if (typeof caches === 'undefined') {
      /* No Cache Storage means no service worker either -- normal on the dev
         server, where the PWA plugin is disabled. */
      setState({ status: 'unsupported', total: urls.length, cached: 0, missing: [] });
      return;
    }
    setState((s) => ({ ...s, status: 'checking' }));
    try {
      const names = await caches.keys();
      const opened = await Promise.all(names.map((n) => caches.open(n)));
      const missing = [];
      for (const url of urls) {
        let hit = false;
        for (const c of opened) {
          /* eslint-disable no-await-in-loop */
          if (await c.match(url, { ignoreSearch: true, ignoreVary: true })) {
            hit = true;
            break;
          }
        }
        if (!hit) missing.push(url.split('/').pop());
      }
      setState({
        status: missing.length ? 'partial' : 'ready',
        total: urls.length,
        cached: urls.length - missing.length,
        missing,
      });
    } catch {
      setState({ status: 'error', total: urls.length, cached: 0, missing: [] });
    }
  }, []);

  useEffect(() => {
    if (active) check();
  }, [active, check]);

  return { ...state, recheck: check };
}
