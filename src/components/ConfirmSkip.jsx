import React, { useEffect, useRef, useState } from 'react';

/* Skipping takes two taps. The boys will be tapping everything, and the
   cutscene skip sits exactly where a 7-year-old's thumb lands -- one stray
   tap would otherwise wipe out a clip that took a generation to make.

   Deliberately a second tap rather than a hold: CLAUDE.md records two nasty
   Android hold-gesture bugs, and this is not the week to add new hold
   targets. The armed state falls back after a few seconds so a single
   curious tap leaves nothing changed. */
const ARMED_MS = 3000;

export default function ConfirmSkip({ onSkip, label, armedLabel = 'tap again to skip', className, style, armedStyle }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const tap = () => {
    if (armed) {
      clearTimeout(timer.current);
      setArmed(false);
      onSkip();
      return;
    }
    setArmed(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setArmed(false), ARMED_MS);
  };

  return (
    <button onClick={tap} className={className} style={armed && armedStyle ? { ...style, ...armedStyle } : style}>
      {armed ? armedLabel : label}
    </button>
  );
}
