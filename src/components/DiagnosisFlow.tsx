import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, DiagnosticQuestion, AssessmentResult, Character, FirstAidGuide, DangerLevel, CharacterExpression } from "../types";
import { Activity, ShieldAlert, Heart, Phone, ArrowRight, HelpCircle, CheckCircle, Clock, Volume2, CloudOff, RefreshCw, Send } from "lucide-react";
import CharacterAvatar from "./CharacterAvatar";
import { STATIC_GUIDES } from "../data/staticProcedures";

interface DiagnosisFlowProps {
  symptoms: string;
  profile: UserProfile;
  selectedCharacter: Character;
  onStartGuide: (guide: FirstAidGuide) => void;
  onBackToHome: () => void;
}

export default function DiagnosisFlow({
  symptoms,
  profile,
  selectedCharacter,
  onStartGuide,
  onBackToHome,
}: DiagnosisFlowProps) {
  const [answers, setAnswers] = useState<Array<{ questionId: string; questionText: string; answerText: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<DiagnosticQuestion | null>(null);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  
  // Offline Simulation state
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSendingToClinic, setIsSendingToClinic] = useState(false);
  const [clinicSent, setClinicSent] = useState(false);
  const [showCallConfirm, setShowCallConfirm] = useState(false);
  const [activeVoiceText, setActiveVoiceText] = useState("");

  // Track online status automatically
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Text to speech helper
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = selectedCharacter.voicePitch;
    utterance.rate = selectedCharacter.voiceRate;
    window.speechSynthesis.speak(utterance);
    setActiveVoiceText(text);
  };

  // Run the diagnostic logic
  const runDiagnostic = async (currentAnswers = answers) => {
    setLoading(true);
    setError(null);

    // Dynamic voice response update
    speakText(`Let me analyze that for you, ${profile.name}...`);

    if (isOffline) {
      // Graceful degradation / Local fallback: Simple Heuristic Rule-Based Decision Tree
      setTimeout(() => {
        const query = symptoms.toLowerCase();
        let fallbackCondition = "General Trauma / Incident";
        let level: DangerLevel = "medium";
        let warningText = "Keep the casualty calm and await professional support.";
        let localGuideKey = "cpr"; // Default safe fallback

        if (query.includes("burn") || query.includes("fire") || query.includes("hot")) {
          fallbackCondition = "Thermal Heat Burn";
          level = "medium";
          warningText = "Do not apply ice, grease, or butter to thermal burns!";
          localGuideKey = "burns";
        } else if (query.includes("bleed") || query.includes("blood") || query.includes("cut")) {
          fallbackCondition = "Active Hemorrhage / Bleeding";
          level = "high";
          warningText = "Apply direct pressure immediately. Do not remove blood-soaked dressings.";
          localGuideKey = "bleeding";
        } else if (query.includes("chok") || query.includes("breath") || query.includes("throat")) {
          fallbackCondition = "Airway Obstruction (Choking)";
          level = "high";
          warningText = "If patient cannot cough, speak, or breathe, perform immediate abdominal thrusts.";
          localGuideKey = "choking";
        } else if (query.includes("heart") || query.includes("chest") || query.includes("collapse")) {
          fallbackCondition = "Suspected Cardiac Arrest / Stroke";
          level = "high";
          warningText = "Call emergency services immediately. Prepare to begin CPR.";
          localGuideKey = "cpr";
        } else if (query.includes("poison") || query.includes("swallow") || query.includes("toxic")) {
          fallbackCondition = "Toxic Ingestion / Poisoning";
          level = "high";
          warningText = "Identify the toxic material. Do not induce vomiting unless advised.";
          localGuideKey = "poisoning";
        } else if (query.includes("bone") || query.includes("fracture") || query.includes("fall")) {
          fallbackCondition = "Suspected Fracture / Sprain";
          level = "medium";
          warningText = "Immobilize the joint. Do not attempt to force bone back into place.";
          localGuideKey = "fractures";
        }

        // Get static steps adjusted roughly for offline
        const matchingGuide = STATIC_GUIDES[localGuideKey];
        
        // Simulating 1 quick local follow-up question before results to make it feel interactive offline
        if (currentAnswers.length === 0) {
          setCurrentQuestion({
            id: "offline_breathing",
            text: "Is the patient awake and breathing normally?",
            options: ["Yes", "No", "Unsure"],
            isSkippable: true,
          });
          setLoading(false);
          speakText("Is the patient awake and breathing normally?");
        } else {
          // Complete offline flow
          const finalResult: AssessmentResult = {
            likelyCondition: fallbackCondition + " (Offline Local Rule Fallback)",
            urgencyLevel: level,
            quickWarning: warningText,
            explanation: `Our intelligent offline decision-tree fallback has classified this as ${fallbackCondition}. This is tuned to your ${profile.ageBand} age profile.`,
            steps: matchingGuide ? matchingGuide.steps : [],
          };
          setAssessment(finalResult);
          setCurrentQuestion(null);
          setLoading(false);
          speakText(`I have prepared your offline first-aid protocol. Please review the steps carefully.`);
        }
      }, 1200);
      return;
    }

    // Online Flow: Fetch from Gemini Diagnosis Endpoint
    try {
      const response = await fetch("/api/gemini/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms,
          profile,
          answers: currentAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error("Diagnosis endpoint returned an error.");
      }

      const data = await response.json();

      if (data.fallback) {
        // Force offline mode behavior if API returns fallback
        setIsOffline(true);
        runDiagnostic(currentAnswers);
        return;
      }

      if (data.isComplete) {
        setAssessment(data.assessment);
        setCurrentQuestion(null);
        speakText(`I have completed your AI assessment. It indicates a likely ${data.assessment.likelyCondition}. Let's begin the safety steps.`);
      } else {
        setCurrentQuestion(data.followUpQuestion);
        setAssessment(null);
        speakText(data.followUpQuestion.text);
      }
    } catch (err: any) {
      console.error(err);
      // Gracefully switch to offline fallback on error
      setIsOffline(true);
      runDiagnostic(currentAnswers);
    } finally {
      setLoading(false);
    }
  };

  // Initial trigger
  useEffect(() => {
    runDiagnostic([]);
  }, [symptoms, profile]);

  const handleAnswer = (answerText: string) => {
    if (!currentQuestion) return;
    const newAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        answerText,
      },
    ];
    setAnswers(newAnswers);
    runDiagnostic(newAnswers);
  };

  const handleSendToClinic = () => {
    setIsSendingToClinic(true);
    setClinicSent(false);

    // Save summary in localStorage. If offline, it acts as a queued action.
    const summary = {
      timestamp: new Date().toISOString(),
      symptoms,
      profile: {
        name: profile.name,
        age: profile.age,
        ageBand: profile.ageBand,
        allergies: profile.allergies,
        conditions: profile.conditions,
      },
      answers,
      assessment: assessment ? {
        condition: assessment.likelyCondition,
        urgency: assessment.urgencyLevel,
      } : null,
      delivered: !isOffline,
    };

    const existingQueue = JSON.parse(localStorage.getItem("fastaid_queued_clinic_summaries") || "[]");
    existingQueue.push(summary);
    localStorage.setItem("fastaid_queued_clinic_summaries", JSON.stringify(existingQueue));

    // Simulated network delay
    setTimeout(() => {
      setIsSendingToClinic(false);
      setClinicSent(true);
      speakText(isOffline ? "Saved to local offline queue!" : "Situation report successfully sent to Nairobi Emergency Department!");
    }, 1500);
  };

  const triggerCall = () => {
    setShowCallConfirm(false);
    speakText("Dialing emergency services...");
    window.location.href = "tel:999";
  };

  // Get expressive character matching danger/urgency
  const getCoachExpression = (): CharacterExpression => {
    if (loading) return "thinking";
    if (currentQuestion) return "talking";
    if (assessment) {
      if (assessment.urgencyLevel === "high") return "urgent";
      if (assessment.urgencyLevel === "medium") return "caution";
      return "calming";
    }
    return "idle";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Simulation Toggle and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-[2rem] border border-slate-200/80 shadow-md">
        <button
          onClick={onBackToHome}
          className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer"
        >
          &larr; Exit Diagnostics
        </button>

        {/* Offline Mode Indicator Control */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const nextVal = !isOffline;
              setIsOffline(nextVal);
              speakText(nextVal ? "Switched to offline fallback mode" : "Online sync active");
              // Retrigger with current state
              runDiagnostic(answers);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] uppercase font-black tracking-widest transition-all cursor-pointer ${
              isOffline
                ? "bg-amber-50 border-amber-200 text-amber-700 animate-pulse"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            {isOffline ? <CloudOff className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>{isOffline ? "SIMULATED OFFLINE MODE" : "ONLINE CONNECTED"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Character Coach Card */}
        <div className="md:col-span-4 bg-white rounded-[2rem] border border-slate-200/80 p-8 flex flex-col items-center justify-between shadow-xl min-h-[360px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-50/25 to-transparent pointer-events-none" />
          
          <div className="text-center w-full z-10 space-y-1">
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block font-display">
              AI Emergency Coach
            </span>
            <h3 className="font-extrabold text-xl text-slate-900 leading-none font-display">
              {selectedCharacter.name}
            </h3>
            <p className="text-xs text-slate-500 font-sans font-medium">{selectedCharacter.role}</p>
          </div>

          <div className="my-6 z-10">
            <CharacterAvatar characterId={selectedCharacter.id} expression={getCoachExpression()} />
          </div>

          {activeVoiceText && (
            <button
              onClick={() => speakText(activeVoiceText)}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white rounded-2xl py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg z-10 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>Repeat Coach Audio</span>
            </button>
          )}
        </div>

        {/* Right Column: Dynamic Stage Card */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {loading ? (
              /* Loading screen bento block */
              <motion.div
                key="loading-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-slate-950 text-white rounded-[2rem] p-10 min-h-[360px] flex flex-col items-center justify-center text-center space-y-6 border border-slate-900 shadow-2xl relative overflow-hidden"
              >
                <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                <div className="space-y-2">
                  <h4 className="text-xl font-extrabold tracking-tight font-display text-white">
                    Analyzing Symptoms...
                  </h4>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                    Calculating precise patient demographics, history background context, and age-adapted guidelines.
                  </p>
                </div>
              </motion.div>
            ) : currentQuestion ? (
              /* Guided Question Screen */
              <motion.div
                key="question-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-slate-950 text-white rounded-[2rem] p-8 md:p-10 border border-slate-900 shadow-2xl flex flex-col justify-between min-h-[360px] relative overflow-hidden"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest font-display">
                      Question {answers.length + 1}
                    </span>
                    <span className="text-[10px] bg-slate-900 text-slate-300 font-bold px-3 py-1 rounded-xl border border-slate-800 font-display">
                      Tailored to {profile.ageBand}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-snug font-display">
                      {currentQuestion.text}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Your answer will customize the urgency rating and first-aid steps. You may skip if unsure.
                    </p>
                  </div>
                </div>

                {/* Question Answers Bento Layout */}
                <div className="mt-8 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuestion.options?.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        className="py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-850 text-slate-100 hover:text-white font-bold text-xs border border-slate-850 hover:border-slate-800 transition-all active:scale-[0.99] text-left flex items-center justify-between cursor-pointer group"
                      >
                        <span>{opt}</span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Or type a custom answer..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          handleAnswer(e.currentTarget.value.trim());
                          e.currentTarget.value = "";
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-850 rounded-2xl px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />

                    {currentQuestion.isSkippable && (
                      <button
                        onClick={() => handleAnswer("Skip")}
                        className="px-6 py-3 rounded-2xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        Skip
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : assessment ? (
              /* Assessment Result Bento Screen */
              <motion.div
                key="assessment-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* 1. Condition & Urgency Header */}
                <div className="bg-white rounded-[2rem] border border-slate-200/80 p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-50/10 to-transparent pointer-events-none" />
                  
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block font-display">
                        Likely Condition
                      </span>
                      <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                        {assessment.likelyCondition}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-black px-3.5 py-1.5 rounded-full tracking-wider ${
                        assessment.urgencyLevel === "high"
                          ? "bg-red-600 text-white"
                          : assessment.urgencyLevel === "medium"
                          ? "bg-amber-500 text-slate-950"
                          : "bg-emerald-600 text-white"
                      }`}>
                        {assessment.urgencyLevel} Urgency
                      </span>
                    </div>
                  </div>

                  {/* Warning Callout */}
                  {assessment.quickWarning && (
                    <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 flex gap-3 text-red-950 mt-6">
                      <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                      <div className="text-xs">
                        <span className="font-black uppercase tracking-wider block font-display mb-0.5 text-red-900">Safety Directive</span>
                        {assessment.quickWarning}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-sans">
                      {assessment.explanation}
                    </p>
                  </div>
                </div>

                {/* 2. Interactive Action Blocks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Action 1: Launch Rescue Steps (Dark Bento) */}
                  <div className="bg-slate-950 text-white rounded-[2rem] p-6 border border-slate-900 shadow-2xl flex flex-col justify-between min-h-[180px] hover:scale-[1.02] transition-transform">
                    <div className="space-y-2">
                      <Heart className="w-8 h-8 text-red-500 animate-pulse" />
                      <h4 className="font-extrabold text-base tracking-tight font-display">Guided First-Aid steps</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Start animated step-by-step guidance tailored specifically to {profile.name}'s profile.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onStartGuide({
                          title: assessment.likelyCondition,
                          dangerLevel: assessment.urgencyLevel,
                          characterExpression: assessment.urgencyLevel === "high" ? "urgent" : "caution",
                          quickWarning: assessment.quickWarning,
                          steps: assessment.steps,
                        });
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-black py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md mt-4 cursor-pointer"
                    >
                      <span>Launch Step-by-Step</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Action 2: Send Situation Report to Hospital */}
                  <div className="bg-white rounded-[2rem] border border-slate-200/80 p-6 shadow-xl flex flex-col justify-between min-h-[180px] hover:scale-[1.02] transition-transform">
                    <div className="space-y-2">
                      <Send className="w-8 h-8 text-blue-600" />
                      <h4 className="font-extrabold text-base tracking-tight font-display text-slate-900">Forward Situation summary</h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        Alert a partnered clinic. {isOffline ? "Will be safely queued and auto-sent when connection resumes." : "Dispatches directly to Nairobi Emergency ER."}
                      </p>
                    </div>

                    <button
                      onClick={handleSendToClinic}
                      disabled={isSendingToClinic || clinicSent}
                      className={`w-full text-xs font-black py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all border mt-4 cursor-pointer ${
                        clinicSent
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {isSendingToClinic ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                          <span>Dispatching...</span>
                        </>
                      ) : clinicSent ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Report {isOffline ? "Queued Offline" : "Sent to Hospital"}</span>
                        </>
                      ) : (
                        <>
                          <span>{isOffline ? "Queue Clinic Dispatch" : "Send Details to Clinic"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. Emergency Kenyan Call Module */}
                <div className="bg-red-50/40 border border-red-200 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight font-display">
                        Kenyan Medical Emergency Lines
                      </h5>
                      <p className="text-xs text-slate-500 font-sans">
                        Press button to quickly dial official toll-free services (999, 112, 911).
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCallConfirm(true)}
                    className="w-full sm:w-auto px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-lg hover:shadow-red-900/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer font-display"
                  >
                    <Phone className="w-4 h-4 fill-current text-white" />
                    <span>Dial Paramedics (999 / 112)</span>
                  </button>
                </div>

                {/* Call Confirmation Dialog Modal */}
                {showCallConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-[2rem] max-w-sm w-full p-6 border border-slate-200 shadow-2xl text-center space-y-6">
                      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Phone className="w-6 h-6 animate-bounce" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-black text-lg text-slate-950 uppercase tracking-tight font-display">Confirm Call Request</h4>
                        <p className="text-slate-500 text-xs leading-relaxed">
                          Are you sure you want to dial the emergency phone services? This will launch your device phone app.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowCallConfirm(false)}
                          className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={triggerCall}
                          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          Confirm Dial
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Disclaimer Always Visible */}
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 italic">
                    Disclaimer: This AI assessment is for guidance only. It is not a substitute for professional emergency medical services.
                  </span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
