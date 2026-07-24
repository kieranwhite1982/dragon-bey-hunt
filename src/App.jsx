import React, { useCallback, useEffect, useRef, useState } from 'react';

import { STAGES } from './data/stages.js';
import useAudio from './audio/useAudio.js';
import useWakeLock from './hooks/useWakeLock.js';
import { clearRun, loadRun, saveRun } from './hooks/useSavedRun.js';
import { BEY_ASSEMBLED, IGNIS_INTRO, IGNIS_PORTRAIT, WYRM_SMASH, IGNIS_VICTORY } from './optionalAssets.js';

import Dragon from './components/Dragon.jsx';
import FloorMap from './components/FloorMap.jsx';
import RadarPad from './components/RadarPad.jsx';
import SealPads from './components/SealPads.jsx';
import Battle from './components/Battle.jsx';
import Narrator from './components/Narrator.jsx';
import Confetti from './components/Confetti.jsx';
import ParentPanel from './components/ParentPanel.jsx';
import TitleScreen from './components/TitleScreen.jsx';
import PartIcon from './components/PartIcon.jsx';
import IgnisIntro from './components/IgnisIntro.jsx';
import VideoCutscene from './components/VideoCutscene.jsx';

import { C } from './theme.js';

const STUCK_MS = 60000;

export default function App() {
  const audio = useAudio();
  const [screen, setScreen] = useState('title');
  const [stageIdx, setStageIdx] = useState(0);
  const [step, setStep] = useState('navigate');
  const [floor, setFloor] = useState('up');
  const [wrongId, setWrongId] = useState(null);
  const [showArrow, setShowArrow] = useState(false);
  const [parts, setParts] = useState([]);
  const [parent, setParent] = useState(false);

  const [saved, setSaved] = useState(() => loadRun());
  const tapRef = useRef(0);
  const tapTimer = useRef(null);

  const stage = STAGES[stageIdx];

  /* Keep the screen awake once the hunt is actually running. */
  useWakeLock(screen === 'hunt' || screen === 'battle');

  /* Sixty seconds stuck on one room and a big pulsing arrow appears.
     Deliberately generous — the point is to rescue a stall, not to nag. */
  useEffect(() => {
    if (screen !== 'hunt' || step !== 'navigate') {
      setShowArrow(false);
      return undefined;
    }
    setShowArrow(false);
    const id = setTimeout(() => setShowArrow(true), STUCK_MS);
    return () => clearTimeout(id);
  }, [screen, step, stageIdx]);

  useEffect(() => () => clearTimeout(tapTimer.current), []);

  /* Autosave. If the phone locks or the tab is evicted mid-hunt, the title
     screen offers a resume rather than restarting with presents already
     unwrapped. */
  useEffect(() => {
    if (screen === 'hunt' || screen === 'battle') {
      saveRun({ screen, stageIdx, step, floor, parts });
    }
  }, [screen, stageIdx, step, floor, parts]);

  const pickRoom = (id) => {
    if (step !== 'navigate') return;
    if (id === stage.roomId) {
      audio.blip(900, 0.12, 'square', 0.2);
      setTimeout(() => audio.blip(1300, 0.16, 'square', 0.2), 110);
      setWrongId(null);
      setStep('radar');
    } else {
      /* Wrong room shakes and grumbles. No penalty — guessing is half the
         fun and a 6-year-old will tap everything. */
      audio.grumble();
      setWrongId(id);
      setTimeout(() => setWrongId(null), 500);
    }
  };

  const onFound = useCallback(() => {
    setStep('grab');
  }, []);

  const onSealBroken = useCallback(() => {
    setParts((p) => [...p, stage.part]);
    setStep('reward');
  }, [stage]);

  const nextStage = () => {
    if (stageIdx === STAGES.length - 1) {
      setScreen('battle');
    } else {
      const ni = stageIdx + 1;
      setStageIdx(ni);
      setFloor(STAGES[ni].floor);
      setStep('navigate');
      audio.spinUp(0.8);
    }
  };

  const titleTap = () => {
    tapRef.current += 1;
    if (tapRef.current >= 4) {
      tapRef.current = 0;
      setParent(true);
    }
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapRef.current = 0;
    }, 1600);
  };

  const resetAll = () => {
    clearRun();
    setSaved(null);
    setScreen('title');
    setStageIdx(0);
    setParts([]);
    setStep('navigate');
    setFloor('up');
    setParent(false);
  };

  const beginHunt = () => {
    /* This tap unlocks the audio context for the whole session -- every
       cutscene and narrator clip that follows plays with sound because of
       it, so nothing else needs a gesture of its own. */
    audio.unlock();
    audio.roar(1.2);
    setScreen(IGNIS_INTRO ? 'coldopen' : WYRM_SMASH ? 'theft' : 'brief');
  };

  const continueRun = () => {
    if (!saved) return;
    audio.unlock();
    audio.roar(0.9);
    setStageIdx(saved.stageIdx);
    setStep(saved.step || 'navigate');
    setFloor(saved.floor || STAGES[saved.stageIdx].floor);
    setParts(saved.parts || []);
    setScreen(saved.screen);
  };

  const shell = (children) => (
    <div
      className="dbh-viewport w-full flex flex-col relative overflow-hidden"
      style={{ background: `radial-gradient(circle at 50% 0%, ${C.night2}, ${C.night} 70%)` }}
    >
      {children}
      {parent && (
        <ParentPanel
          onClose={() => setParent(false)}
          onReset={resetAll}
          onJump={(i) => {
            setStageIdx(i);
            setFloor(STAGES[i].floor);
            setStep('navigate');
            setScreen('hunt');
            setParent(false);
          }}
        />
      )}
    </div>
  );

  /* ---------- TITLE ---------- */
  if (screen === 'title') {
    return shell(
      <TitleScreen
        onStart={beginHunt}
        onContinue={continueRun}
        resumeLabel={
          saved
            ? saved.screen === 'battle'
              ? '↩ BACK TO THE FINAL BATTLE'
              : `↩ CARRY ON FROM PART ${saved.stageIdx + 1} / 5`
            : null
        }
        onHeaderTap={titleTap}
      />
    );
  }

  /* ---------- OPTIONAL COLD OPEN ---------- */
  if (screen === 'coldopen') {
    return shell(<IgnisIntro onDone={() => setScreen(WYRM_SMASH ? 'theft' : 'brief')} />);
  }

  /* ---------- OPTIONAL THEFT CUTSCENE ---------- */
  /* Silent by design (see docs/FLOW-PROMPTS.md) -- no speech to hold or
     release here, unlike the cold open. */
  if (screen === 'theft') {
    return shell(<VideoCutscene src={WYRM_SMASH} onDone={() => setScreen('brief')} />);
  }

  /* ---------- NARRATOR ---------- */
  if (screen === 'brief') {
    return shell(<Narrator audio={audio} onFinish={() => setScreen('hunt')} />);
  }

  /* ---------- BATTLE ---------- */
  if (screen === 'battle') {
    return shell(
      <>
        <div className="px-4 pt-3 text-center">
          <h2 className="font-black text-2xl" style={{ color: C.gold, textShadow: `0 0 16px ${C.ember}` }} onClick={titleTap}>
            FINAL BATTLE
          </h2>
          <p className="text-xs font-bold text-white opacity-70">All 5 parts assembled. Let it rip.</p>
        </div>
        <div className="flex-1 min-h-0">
          <Battle audio={audio} onDone={() => setScreen(IGNIS_VICTORY ? 'victoryintro' : 'victory')} />
        </div>
      </>
    );
  }

  /* ---------- OPTIONAL VICTORY CUTSCENE ---------- */
  /* Plays full-screen before the confetti/text victory screen, rather than
     layered behind it -- compositing a talking dragon under semi-transparent
     confetti and headline text got cluttered fast, and this way the clip
     gets watched properly before the payoff screen takes over. */
  if (screen === 'victoryintro') {
    return shell(<VideoCutscene src={IGNIS_VICTORY} onDone={() => setScreen('victory')} />);
  }

  /* ---------- VICTORY ---------- */
  if (screen === 'victory') {
    return shell(
      <div className="flex-1 relative flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <Confetti run />
        {/* The finished Bey they spent the whole hunt assembling, if that art
            exists; otherwise Ignis sees them off; otherwise a trophy. All
            three are optional, same as every other asset in the app. */}
        {BEY_ASSEMBLED ? (
          <div
            className="floaty relative rounded-full overflow-hidden"
            style={{
              width: 140,
              height: 140,
              border: `4px solid ${C.gold}`,
              boxShadow: `0 0 46px ${C.ember}`,
            }}
          >
            <img src={BEY_ASSEMBLED} alt="" className="w-full h-full object-cover" />
          </div>
        ) : IGNIS_PORTRAIT ? (
          <div
            className="floaty relative rounded-full overflow-hidden"
            style={{
              width: 128,
              height: 128,
              border: `4px solid ${C.gold}`,
              boxShadow: `0 0 40px ${C.ember}`,
            }}
          >
            <img src={IGNIS_PORTRAIT} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="text-7xl floaty relative">🏆</div>
        )}
        <h1
          className="font-black mt-3 relative"
          style={{ fontSize: 38, color: C.gold, textShadow: `0 0 22px ${C.ember}, 3px 3px 0 ${C.flame}` }}
        >
          HAPPY BIRTHDAY
          <br />
          EVAN!
        </h1>
        <p className="mt-3 font-bold text-white relative">
          You beat the Shadow Wyrm.
          <br />
          The Dragon Beyblade is yours.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4 relative">
          {parts.map((p, i) => (
            <div
              key={i}
              className="px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5"
              style={{ background: p.color, color: '#1a0b2e' }}
            >
              <PartIcon part={p} size={18} ring={false} />
              {p.name}
            </div>
          ))}
        </div>
        <p className="mt-4 font-black relative" style={{ color: C.cyan }}>
          Great radar work, Sawyer 🤖
        </p>
        <button
          onClick={resetAll}
          className="mt-6 px-8 py-3 rounded-full font-black relative"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)' }}
        >
          Play again
        </button>
      </div>
    );
  }

  /* ---------- HUNT ---------- */
  const wrongFloor = floor !== stage.floor;

  return shell(
    <>
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="font-black text-lg" style={{ color: C.gold }} onClick={titleTap}>
            🐉 PART {stage.n} / 5
          </div>
          <div className="flex gap-1">
            {STAGES.map((s, i) => (
              <div
                key={s.n}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black overflow-hidden"
                style={{
                  background: i < parts.length ? parts[i].color : 'rgba(255,255,255,0.12)',
                  color: i < parts.length ? '#1a0b2e' : 'rgba(255,255,255,0.4)',
                  border: i === stageIdx ? `2px solid ${C.gold}` : '2px solid transparent',
                }}
              >
                {/* 22, not 26: the w-7 box has a 2px border, leaving 24px of
                    content, and a 26px icon would be clipped by overflow. */}
                {i < parts.length ? <PartIcon part={parts[i]} size={22} ring={false} /> : s.n}
              </div>
            ))}
          </div>
        </div>
      </div>

      {step === 'navigate' && (
        <>
          <div className="px-3 pb-2 flex items-center gap-2">
            <div style={{ flexShrink: 0 }}>
              <Dragon speaking size={78} />
            </div>
            <div
              className="rounded-2xl px-3 py-2 font-bold text-white text-sm flex-1"
              style={{ background: 'rgba(255,255,255,0.10)', border: `2px solid ${C.ember}` }}
            >
              {stage.taunt}
            </div>
          </div>

          <div className="px-3 pb-2 flex gap-2">
            {['up', 'down'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFloor(f);
                  audio.blip(600, 0.07);
                }}
                className="flex-1 py-2 rounded-xl font-black text-sm"
                style={{
                  background: floor === f ? C.gold : 'rgba(255,255,255,0.10)',
                  color: floor === f ? '#3b1f0b' : '#fff',
                  border: `2px solid ${floor === f ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                }}
              >
                {f === 'up' ? '⬆️ UPSTAIRS' : '⬇️ DOWNSTAIRS'}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 px-2 pb-2">
            <div className="w-full h-full rounded-2xl overflow-hidden" style={{ border: `4px solid ${C.gold}` }}>
              {/* On the wrong floor the highlight is hidden entirely —
                  finding the stairs is part of the game. */}
              <FloorMap
                floor={floor}
                targetRoom={wrongFloor ? null : stage.roomId}
                showArrow={showArrow && !wrongFloor}
                onPick={pickRoom}
                wrongId={wrongId}
              />
            </div>
          </div>

          <div className="px-3 pb-3 text-center font-black text-sm" style={{ color: wrongFloor ? C.flame : '#fff' }}>
            {wrongFloor
              ? stage.floor === 'down'
                ? '🐉 Go DOWNSTAIRS! Tap the downstairs button.'
                : '🐉 Go UPSTAIRS! Tap the upstairs button.'
              : 'EVAN: tap the glowing room, then RUN there!'}
          </div>
        </>
      )}

      {step === 'radar' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center overflow-auto">
          <h2 className="font-black text-2xl" style={{ color: C.cyan }}>
            SAWYER&apos;S TURN
          </h2>
          <p className="font-bold text-white mt-2 text-sm">
            You&apos;re in <span style={{ color: C.gold }}>{stage.roomName}</span>.
            <br />
            Sawyer — hold the radar to sniff out the spot!
          </p>
          <RadarPad audio={audio} onFound={onFound} />
        </div>
      )}

      {step === 'grab' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-7xl pop">{stage.spotEmoji}</div>
          <h2 className="font-black text-xl mt-3" style={{ color: C.lime }}>
            RADAR LOCK!
          </h2>
          <div
            className="mt-3 px-5 py-4 rounded-3xl pop"
            style={{ background: `linear-gradient(180deg, ${C.gold}, ${C.ember})`, border: '5px solid #fff' }}
          >
            <div className="font-black text-xl" style={{ color: '#3b0d00' }}>
              {stage.spot}
            </div>
          </div>
          <p className="mt-4 font-bold text-white">GO! Grab the treasure!</p>
          <button
            onClick={() => {
              audio.blip(800, 0.14);
              setStep('seal');
            }}
            className="mt-7 px-10 py-5 rounded-full font-black text-2xl glowy"
            style={{ background: `linear-gradient(180deg,${C.flame},#9d174d)`, color: '#fff', border: '5px solid #fff' }}
          >
            GOT IT! 🙌
          </button>
        </div>
      )}

      {step === 'seal' && (
        <div className="flex-1 flex flex-col px-4 pb-4 min-h-0">
          <div className="text-center">
            <div className="text-5xl floaty">🔒</div>
            <h2 className="font-black text-2xl" style={{ color: C.gold }}>
              DRAGON SEAL
            </h2>
            <p className="font-bold text-white text-sm mt-1">
              The Bey part is locked inside!
              <br />
              <span style={{ color: C.flame }}>BOTH of you hold your pad — at the same time!</span>
            </p>
          </div>
          <SealPads audio={audio} onBroken={onSealBroken} />
        </div>
      )}

      {step === 'reward' && (
        <div className="flex-1 relative flex flex-col items-center justify-center px-6 text-center overflow-hidden">
          <Confetti run />
          <div className="pop relative">
            <PartIcon part={stage.part} size={112} />
          </div>
          <h2
            className="font-black text-3xl mt-2 pop relative"
            style={{ color: stage.part.color, textShadow: '2px 2px 0 rgba(0,0,0,0.4)' }}
          >
            {stage.part.name}
          </h2>
          <p className="font-bold text-white mt-2 relative">RECLAIMED!</p>

          {/* Naming the real present is the whole payoff. */}
          <div
            className="mt-4 px-5 py-4 rounded-3xl relative"
            style={{ background: 'rgba(255,255,255,0.12)', border: `3px solid ${C.gold}` }}
          >
            <div className="text-xs font-black" style={{ color: C.gold }}>
              THE DRAGON HID IT INSIDE…
            </div>
            <div className="font-black text-2xl text-white mt-1">{stage.gift}</div>
            <div className="text-3xl mt-1">🎁</div>
          </div>

          <div className="flex gap-2 mt-4 relative">
            {STAGES.map((s, i) => (
              <div
                key={s.n}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg overflow-hidden"
                style={{ background: i < parts.length ? parts[i].color : 'rgba(255,255,255,0.12)' }}
              >
                {i < parts.length ? <PartIcon part={parts[i]} size={34} ring={false} /> : '·'}
              </div>
            ))}
          </div>

          <button
            onClick={nextStage}
            className="mt-6 px-9 py-4 rounded-full font-black text-xl glowy relative"
            style={{ background: `linear-gradient(180deg,${C.lime},#3f6212)`, color: '#12240b', border: '5px solid #fff' }}
          >
            {stageIdx === STAGES.length - 1 ? 'ASSEMBLE THE DRAGON BEY ⚔️' : `HUNT PART ${stage.n + 1} →`}
          </button>
        </div>
      )}
    </>
  );
}
