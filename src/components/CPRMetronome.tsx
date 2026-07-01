import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Play, Square, Volume2, VolumeX } from "lucide-react";

export default function CPRMetronome() {
  const [isActive, setIsActive] = useState(false);
  const [bpm, setBpm] = useState(110); // 100-120 is the sweet spot
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [count, setCount] = useState(0);
  const [flash, setFlash] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentCountRef = useRef(0);

  // Initialize AudioContext lazily on user gesture
  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Create synthetic metronome sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Pitch: high accent for beat 1 of each 30 cycle, standard for the rest
      const isFirstBeat = currentCountRef.current === 1;
      osc.type = "sine";
      osc.frequency.setValueAtTime(isFirstBeat ? 1000 : 800, ctx.currentTime);

      // Amplitude envelope (extremely short click)
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (err) {
      console.warn("AudioContext error:", err);
    }
  };

  useEffect(() => {
    if (isActive) {
      const intervalMs = (60 / bpm) * 1000;
      currentCountRef.current = 0;
      setCount(0);

      const tick = () => {
        // Increment compression counter 1-30
        currentCountRef.current = (currentCountRef.current % 30) + 1;
        setCount(currentCountRef.current);
        
        // Trigger visual flash
        setFlash(true);
        setTimeout(() => setFlash(false), 80);

        // Play auditory guide tick
        playClickSound();

        // Schedule next tick
        timerRef.current = setTimeout(tick, intervalMs);
      };

      timerRef.current = setTimeout(tick, intervalMs);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isActive, bpm, soundEnabled]);

  const toggleMetronome = () => {
    if (!isActive) {
      // Trigger short audio initialization
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {}
    }
    setIsActive(!isActive);
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className={`w-5 h-5 ${isActive ? "text-red-500 animate-pulse" : "text-slate-400"}`} />
          <h4 className="font-semibold text-sm tracking-tight text-slate-200">CPR Compression Metronome</h4>
        </div>
        <span className="bg-red-500/10 text-red-400 text-xs font-mono px-2 py-0.5 rounded border border-red-500/20">
          Target: 100-120 bpm
        </span>
      </div>

      {/* Visual Ripple and Count Sphere */}
      <div className="relative h-44 flex flex-col items-center justify-center bg-slate-950 rounded-xl overflow-hidden mb-4 border border-slate-800/80">
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute w-20 h-20 rounded-full border border-red-500/40 bg-red-500/5"
            />
          )}
        </AnimatePresence>

        {/* Inner compression circle */}
        <motion.div
          animate={flash ? { scale: 0.92 } : { scale: 1.0 }}
          transition={{ duration: 0.05 }}
          className={`w-28 h-28 rounded-full flex flex-col items-center justify-center relative z-10 border-2 transition-all duration-75 ${
            flash
              ? "border-red-500 bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
              : "border-slate-700 bg-slate-800"
          }`}
        >
          <span className="text-xs font-semibold opacity-80 uppercase tracking-wider text-slate-300">
            {isActive ? "Push" : "Ready"}
          </span>
          <span className="text-3xl font-mono font-bold">
            {isActive ? count : "0"}
          </span>
          <span className="text-[10px] font-semibold opacity-80">
            {isActive ? "of 30" : "CPR Beat"}
          </span>
        </motion.div>

        {/* Breathing cycle prompt overlay */}
        {isActive && count > 25 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-2 bg-yellow-500 text-slate-950 font-bold text-xs px-3 py-1 rounded-full shadow-lg"
          >
            Prepare rescue breaths next!
          </motion.div>
        )}
      </div>

      {/* BPM and Controls */}
      <div className="space-y-4">
        {/* Sliders and Sound toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>Compression Rate:</span>
              <span className="font-bold text-white">{bpm} BPM</span>
            </div>
            <input
              type="range"
              min="100"
              max="120"
              step="5"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              disabled={isActive}
              className="w-full accent-red-500 bg-slate-800 rounded-lg appearance-none h-2 cursor-pointer disabled:opacity-50"
            />
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-red-400"
                : "bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-500"
            }`}
            title={soundEnabled ? "Mute audio" : "Unmute audio"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Big Start / Stop Button */}
        <button
          onClick={toggleMetronome}
          className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            isActive
              ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 active:scale-98"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 active:scale-98"
          }`}
        >
          {isActive ? (
            <>
              <Square className="w-5 h-5 fill-current" />
              <span>Stop Metronome</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Start CPR Beat</span>
            </>
          )}
        </button>
      </div>

      <p className="text-[10px] text-slate-500 text-center mt-3 leading-tight">
        CPR compressions must be 2 inches deep. Align compressions precisely to this beat.
      </p>
    </div>
  );
}
