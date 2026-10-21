"use client";
// State helpers: undo/redo history and the playback clock.
import { useCallback, useEffect, useRef, useState } from "react";

/** Value with undo/redo. `replace` changes it without a history step (used while dragging). */
export function useHistory(initial) {
  const [s, setS] = useState({ past: [], present: initial, future: [] });
  const resolve = (next, cur) => (typeof next === "function" ? next(cur) : next);
  const set = useCallback((next) => setS((st) => {
    const v = resolve(next, st.present);
    return v === st.present ? st : { past: [...st.past.slice(-49), st.present], present: v, future: [] };
  }), []);
  const replace = useCallback((next) => setS((st) => ({ ...st, present: resolve(next, st.present) })), []);
  const checkpoint = useCallback(() => setS((st) => ({ past: [...st.past.slice(-49), st.present], present: st.present, future: [] })), []);
  const undo = useCallback(() => setS((st) => (st.past.length ? { past: st.past.slice(0, -1), present: st.past[st.past.length - 1], future: [st.present, ...st.future] } : st)), []);
  const redo = useCallback(() => setS((st) => (st.future.length ? { past: [...st.past, st.present], present: st.future[0], future: st.future.slice(1) } : st)), []);
  const reset = useCallback((v) => setS({ past: [], present: v, future: [] }), []);
  return { present: s.present, set, replace, checkpoint, undo, redo, reset, canUndo: s.past.length > 0, canRedo: s.future.length > 0 };
}

/**
 * Playback clock. The voice audio is the master clock while it plays (so pictures follow the sound);
 * without a voice, or after it ends, time is counted by a timer. A setInterval (not requestAnimationFrame)
 * keeps it running in a background tab.
 */
export function usePlayback({ voiceUrl, musicUrl, musicVolume, total }) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(0);
  const totalRef = useRef(total);
  const voice = useRef(null);
  const music = useRef(null);
  totalRef.current = total;

  useEffect(() => {
    if (!voiceUrl) {
      voice.current = null;
      return undefined;
    }
    const a = new Audio(voiceUrl);
    a.preload = "auto";
    voice.current = a;
    return () => {
      a.pause();
      a.src = "";
      if (voice.current === a) voice.current = null;
    };
  }, [voiceUrl]);

  useEffect(() => {
    if (!musicUrl) {
      music.current = null;
      return undefined;
    }
    const a = new Audio(musicUrl);
    a.preload = "auto";
    a.loop = true;
    a.volume = Math.min(1, musicVolume / 100);
    music.current = a;
    return () => {
      a.pause();
      a.src = "";
      if (music.current === a) music.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicUrl]);

  useEffect(() => {
    if (music.current) music.current.volume = Math.min(1, musicVolume / 100);
  }, [musicVolume]);

  const pauseAll = useCallback(() => {
    voice.current?.pause();
    music.current?.pause();
    setPlaying(false);
  }, []);

  const seek = useCallback((x) => {
    const v = Math.max(0, Math.min(x, totalRef.current));
    tRef.current = v;
    setT(v);
    const a = voice.current;
    if (a && Number.isFinite(a.duration)) {
      try {
        a.currentTime = Math.min(v, a.duration);
      } catch {
        /* not ready yet */
      }
    }
    const m = music.current;
    if (m && Number.isFinite(m.duration) && m.duration > 0) {
      try {
        m.currentTime = v % m.duration;
      } catch {
        /* not ready yet */
      }
    }
  }, []);

  const play = useCallback(() => {
    if (!totalRef.current) return;
    if (tRef.current >= totalRef.current - 0.05) seek(0);
    else seek(tRef.current);
    voice.current?.play().catch(() => {});
    music.current?.play().catch(() => {});
    setPlaying(true);
  }, [seek]);

  const toggle = useCallback(() => (playing ? pauseAll() : play()), [playing, pauseAll, play]);

  useEffect(() => {
    if (!playing) return undefined;
    let last = performance.now();
    let shown = tRef.current;
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      const a = voice.current;
      const next = a && !a.paused && !a.ended ? a.currentTime : tRef.current + dt;
      tRef.current = next;
      if (next >= totalRef.current) {
        window.clearInterval(timer);
        voice.current?.pause();
        music.current?.pause();
        tRef.current = totalRef.current;
        setT(totalRef.current);
        setPlaying(false);
        return;
      }
      if (Math.abs(next - shown) >= 0.04) {
        shown = next;
        setT(next);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [playing]);

  return { t, playing, play, pause: pauseAll, toggle, seek };
}
