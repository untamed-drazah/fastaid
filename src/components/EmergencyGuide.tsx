import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Home,
  AlertTriangle,
  Timer,
  Clock,
} from "lucide-react";
import { Character, FirstAidGuide, FirstAidStep, CharacterExpression } from "../types";
import CharacterAvatar from "./CharacterAvatar";
import VisualOverlay from "./VisualOverlay";
import CPRMetronome from "./CPRMetronome";

interface EmergencyGuideProps {
  guide: FirstAidGuide;
  character: Character;
  onExit: () => void;
}

export default function EmergencyGuide({
  guide,
  character,
  onExit,
}: EmergencyGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlayingVoice, setIsPlayingVoice] = useState(true);
  const [characterExpression, setCharacterExpression] = useState<CharacterExpression>("idle");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const currentStep: FirstAidStep = guide.steps[currentStepIndex];

  // Speech references
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false);

  // Timer reference
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Voice Speech Synthesis Engine
  const speakStep = (step: FirstAidStep) => {
    // Stop any active speaking
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;

    if (!isPlayingVoice) {
      setCharacterExpression(guide.characterExpression);
      return;
    }

    try {
      const textToSpeak = `${step.title}. ${step.voiceText}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      speechUtteranceRef.current = utterance;

      // Apply character specific voice qualities
      utterance.rate = character.voiceRate;
      utterance.pitch = character.voicePitch;

      // Select voice based on gender / availability if supported by the browser
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Attempt to match language and voice preferences
        const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
        const matchesGender = englishVoices.filter((v) => {
          const nameLower = v.name.toLowerCase();
          if (character.voiceGender === "female") {
            return nameLower.includes("female") || nameLower.includes("zira") || nameLower.includes("google us english") || nameLower.includes("samantha");
          } else {
            return nameLower.includes("male") || nameLower.includes("david") || nameLower.includes("microsoft") || nameLower.includes("google uk english");
          }
        });
        
        if (matchesGender.length > 0) {
          utterance.voice = matchesGender[0];
        } else if (englishVoices.length > 0) {
          utterance.voice = englishVoices[0];
        }
      }

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setCharacterExpression("talking");
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        // Revert to the recommended expression of the current step
        // e.g. urgent or warning or success
        const isLastStep = currentStepIndex === guide.steps.length - 1;
        setCharacterExpression(isLastStep ? "success" : guide.characterExpression);
      };

      utterance.onerror = (e) => {
        console.warn("Speech synthesis error", e);
        isSpeakingRef.current = false;
        setCharacterExpression(guide.characterExpression);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech Synthesis API failed:", e);
      setCharacterExpression(guide.characterExpression);
    }
  };

  // Speak whenever step or voice toggle changes
  useEffect(() => {
    speakStep(currentStep);

    // If the step has a countdown timer, initialize it
    if (currentStep.durationSeconds > 0) {
      setTimerSeconds(currentStep.durationSeconds);
      setTimerActive(true);
    } else {
      setTimerSeconds(0);
      setTimerActive(false);
    }

    // On unmount/step-change, clean up timer
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, [currentStepIndex, isPlayingVoice, guide]);

  // Handle countdown timers
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            playTimerFinishedBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerActive, timerSeconds]);

  // Play synthetic tone when countdown expires
  const playTimerFinishedBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // high tone
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {}
  };

  const handleNextStep = () => {
    if (currentStepIndex < guide.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Completed, celebrate!
      setCharacterExpression("success");
      const completeUtterance = new SpeechSynthesisUtterance("Procedure completed. Monitor the patient and wait for emergency services.");
      completeUtterance.rate = character.voiceRate;
      completeUtterance.pitch = character.voicePitch;
      window.speechSynthesis.speak(completeUtterance);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleRepeatVoice = () => {
    speakStep(currentStep);
  };

  const toggleVoice = () => {
    const nextVal = !isPlayingVoice;
    setIsPlayingVoice(nextVal);
    if (!nextVal) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      setCharacterExpression(guide.characterExpression);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Danger alert classes
  const dangerBadgeClass =
    guide.dangerLevel === "high"
      ? "bg-red-600 text-white"
      : guide.dangerLevel === "medium"
      ? "bg-amber-500 text-slate-950"
      : "bg-emerald-600 text-white";

  // Check if we require Metronome display alongside steps
  const isCprStep =
    currentStep.illustrationHint === "cpr_chest" ||
    guide.title.toLowerCase().includes("cpr") ||
    guide.title.toLowerCase().includes("cardiopulmonary");

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Action Bar (Bento-styled row) */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-[2rem] border border-slate-200/80 shadow-md">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-xs font-bold transition-all active:scale-97 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Exit Guide</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] uppercase font-black px-3.5 py-1.5 rounded-full tracking-wider ${dangerBadgeClass}`}>
            {guide.dangerLevel} danger level
          </span>
        </div>

        <button
          onClick={toggleVoice}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-black transition-all active:scale-97 cursor-pointer ${
            isPlayingVoice
              ? "bg-red-50 border-red-150 text-red-600 hover:bg-red-100/70"
              : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
          }`}
        >
          {isPlayingVoice ? <Volume2 className="w-4 h-4 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
          <span>{isPlayingVoice ? "Voice ON" : "Voice OFF"}</span>
        </button>
      </div>

      {/* Safety Alert Header */}
      {guide.quickWarning && (
        <div className="bg-red-50/70 border-2 border-red-200 rounded-[2rem] p-5 flex gap-4 text-red-950 shadow-md">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
          <div>
            <h4 className="font-extrabold text-sm tracking-tight text-red-800 uppercase font-display">CRITICAL SAFETY WARNING</h4>
            <p className="text-xs mt-1 leading-relaxed opacity-95">{guide.quickWarning}</p>
          </div>
        </div>
      )}

      {/* Main step grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Left column: Coach Card (col-span-12 md:col-span-4) */}
        <div className="md:col-span-4 bg-white rounded-[2rem] border border-slate-200/80 p-8 flex flex-col items-center justify-between shadow-xl min-h-[360px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/25 to-transparent pointer-events-none" />
          <div className="text-center w-full z-10">
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block mb-1.5 font-display">
              Active Guide Coach
            </span>
            <h3 className="font-extrabold text-xl text-slate-900 leading-none font-display">
              {character.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 font-sans font-medium">{character.role}</p>
          </div>

          <div className="my-6 z-10">
            <CharacterAvatar characterId={character.id} expression={characterExpression} />
          </div>

          <button
            onClick={handleRepeatVoice}
            disabled={!isPlayingVoice}
            className="w-full bg-slate-950 hover:bg-slate-900 disabled:opacity-35 text-white rounded-2xl py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-lg z-10"
          >
            <Volume2 className="w-4 h-4" />
            <span>Repeat Voice Instruction</span>
          </button>
        </div>

        {/* Right column: Bento Blocks (col-span-12 md:col-span-8) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Block 1: Dark Instruction Detail Bento (bg-slate-900) */}
          <div className="bg-slate-950 text-white rounded-[2rem] border border-slate-900 p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            {/* Progress bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-6 flex border border-slate-800">
              {guide.steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-full border-r border-slate-950 last:border-0 transition-all duration-300 ${
                    idx <= currentStepIndex ? "bg-red-600" : "bg-slate-800"
                  }`}
                />
              ))}
            </div>

            <div className="space-y-6 flex-grow">
              {/* Header description */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                  Step {currentStep.stepNumber} of {guide.steps.length}
                </span>
                <span className="text-xs bg-slate-900 text-slate-300 font-bold px-3 py-1 rounded-xl border border-slate-800 font-display">
                  {guide.title}
                </span>
              </div>

              {/* Instruction block */}
              <div className="space-y-3">
                <motion.h2
                  key={`title-${currentStepIndex}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight font-display"
                >
                  {currentStep.title}
                </motion.h2>

                <motion.p
                  key={`desc-${currentStepIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-slate-400 text-sm md:text-base leading-relaxed font-sans"
                >
                  {currentStep.instruction}
                </motion.p>
              </div>
            </div>

            {/* Pro Tip Callout */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mt-6">
              <div className="text-xs text-red-400 uppercase font-bold tracking-wider font-display mb-1">PRO RESCUE TIP</div>
              <p className="text-xs text-slate-300 italic font-sans">
                "Remain completely calm. Breathe deeply, execute the steps carefully, and do not panic."
              </p>
            </div>
          </div>

          {/* Block 2: Visual overlay illustration Bento (bg-white) */}
          <div className="bg-white rounded-[2rem] border border-slate-200/80 p-6 shadow-xl relative overflow-hidden flex flex-col justify-center items-center min-h-[300px]">
            <div className="absolute top-6 left-6 z-10">
              <span className="bg-slate-950 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest font-display">
                Visual Overlay: On
              </span>
            </div>

            {/* Visual Overlay Sketch */}
            <div className="w-full py-4 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`overlay-${currentStepIndex}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full flex justify-center"
                  transition={{ duration: 0.2 }}
                >
                  <VisualOverlay hint={currentStep.illustrationHint} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Block 3: Dynamic Countdown Timer Block (if active) */}
          {currentStep.durationSeconds > 0 && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                  <Timer className={`w-6 h-6 ${timerActive ? "animate-spin" : ""}`} />
                </div>
                <div>
                  <h5 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight font-display">
                    Duration Counter Active
                  </h5>
                  <p className="text-xs text-slate-500 font-sans">
                    Maintain this action continuously until the timer sounds.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-2xl text-slate-950 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl shadow-inner">
                  {formatTime(timerSeconds)}
                </span>

                <button
                  onClick={() => setTimerActive(!timerActive)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    timerActive
                      ? "bg-slate-950 text-white hover:bg-slate-900 border-slate-900"
                      : "bg-red-600 text-white hover:bg-red-700 border-red-600"
                  }`}
                >
                  {timerActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <button
                  onClick={() => {
                    setTimerSeconds(currentStep.durationSeconds);
                    setTimerActive(false);
                  }}
                  className="p-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Block 4: Stepper Navigation Controls Bento */}
          <div className="bg-white rounded-[2rem] border border-slate-200/80 p-6 shadow-xl flex items-center justify-between gap-4">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 font-display cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNextStep}
              className="flex-1 py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-98 transition-all font-display cursor-pointer"
            >
              <span>
                {currentStepIndex === guide.steps.length - 1 ? "Complete Guide" : "Next Step"}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CPR metronome displayed at bottom side if relevant */}
      {isCprStep && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold font-display">
                CPR Tool Active
              </div>
              <h4 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">CPR Compression Rhythm Coach</h4>
              <p className="text-slate-500 text-xs leading-relaxed font-sans">
                Chest compressions must be delivered at 100 to 120 compressions per minute. Use our synchronized audio/visual metronome below. Turn on your speaker and align compressions perfectly with the pulse.
              </p>
            </div>
            <div>
              <CPRMetronome />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
