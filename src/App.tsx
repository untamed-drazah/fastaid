import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Phone, ShieldAlert, Heart, LogOut, Settings, RotateCcw } from "lucide-react";
import { Character, FirstAidGuide, UserProfile } from "./types";
import Dashboard from "./components/Dashboard";
import EmergencyGuide from "./components/EmergencyGuide";
import AuthAndProfile from "./components/AuthAndProfile";
import DiagnosisFlow from "./components/DiagnosisFlow";
import UserProfileModal from "./components/UserProfileModal";

const CHARACTERS: Character[] = [
  {
    id: "joy",
    name: "Dr. Joy",
    role: "Emergency Pediatric Specialist",
    avatarColor: "#EC4899",
    description: "An encouraging, warm expert who speaks clearly with calming reassurance.",
    voiceGender: "female",
    voicePitch: 1.1,
    voiceRate: 0.95,
  },
  {
    id: "sam",
    name: "Paramedic Sam",
    role: "First Responder Veteran",
    avatarColor: "#0D9488",
    description: "An energetic, direct veteran paramedic focused on rapid, precise response.",
    voiceGender: "male",
    voicePitch: 0.9,
    voiceRate: 1.05,
  },
  {
    id: "robo",
    name: "First-Aid Robo",
    role: "AI Rescue Assistant",
    avatarColor: "#3B82F6",
    description: "A friendly, lighthearted robotic rescue buddy with high-tech visual cues.",
    voiceGender: "male",
    voicePitch: 0.65,
    voiceRate: 0.9,
  },
];

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(CHARACTERS[0]);
  const [activeGuide, setActiveGuide] = useState<FirstAidGuide | null>(null);
  const [diagnosisSymptoms, setDiagnosisSymptoms] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "info" | "success" } | null>(null);

  // Load last session or logged in profile on startup
  useEffect(() => {
    const lastProfileName = localStorage.getItem("fastaid_last_profile");
    if (lastProfileName) {
      const stored = localStorage.getItem(`fastaid_profile_${lastProfileName.toLowerCase()}`);
      if (stored) {
        try {
          setUserProfile(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing stored profile.");
        }
      }
    }
  }, []);

  // Trigger brief alert toasts
  const triggerToast = (text: string, type: "info" | "success" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Profile auth completion
  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem("fastaid_last_profile", profile.name.toLowerCase());
    triggerToast(`Welcome back, ${profile.name}! Custom ${profile.ageBand} protocols ready.`, "success");
  };

  // Bypass profile setup for extreme emergencies (Guest mode)
  const handleBypass = () => {
    const guestProfile: UserProfile = {
      name: "Guest",
      age: 30,
      ageBand: "adult",
      password: "guest",
    };
    setUserProfile(guestProfile);
    triggerToast("Bypass Mode: Logged in as Emergency Guest. Adult protocols selected.", "info");
  };

  // Sign out user
  const handleSignOut = () => {
    setUserProfile(null);
    setActiveGuide(null);
    setDiagnosisSymptoms(null);
    localStorage.removeItem("fastaid_last_profile");
    triggerToast("Signed out of your profile safely.", "info");
  };

  // Update existing profile details
  const handleProfileSave = (updated: UserProfile) => {
    setUserProfile(updated);
    const key = `fastaid_profile_${updated.name.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(updated));
    localStorage.setItem("fastaid_last_profile", updated.name.toLowerCase());
    setShowProfileModal(false);
    triggerToast("Profile and medical history updated successfully!", "success");
  };

  // Delete profile permanently
  const handleProfileDelete = () => {
    if (userProfile) {
      const key = `fastaid_profile_${userProfile.name.toLowerCase()}`;
      localStorage.removeItem(key);
      localStorage.removeItem("fastaid_last_profile");
      setUserProfile(null);
      setActiveGuide(null);
      setDiagnosisSymptoms(null);
      setShowProfileModal(false);
      triggerToast("Profile permanently deleted from local cache.", "info");
    }
  };

  // Initiate symptom search - triggers Diagnosis flow instead of direct steps
  const handleSearchCustom = async (query: string) => {
    setDiagnosisSymptoms(query);
  };

  // Load cached last guide if available
  const handleReviewLastAdvice = () => {
    // Look up the last guide we completed or active guide cached
    const cached = localStorage.getItem("fastaid_last_assessment");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setActiveGuide(parsed);
        triggerToast("Restored your most recent assessment and advice.", "success");
      } catch (e) {
        triggerToast("No previous assessment cached.", "info");
      }
    } else {
      triggerToast("No previous rescue assessment has been recorded yet.", "info");
    }
  };

  // Hook into EmergencyGuide completion to save to last session cache
  const handleStartGuideWithCaching = (guide: FirstAidGuide) => {
    localStorage.setItem("fastaid_last_assessment", JSON.stringify(guide));
    setActiveGuide(guide);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-950 flex flex-col justify-between selection:bg-red-600 selection:text-white">
      
      {/* 1. Global Red Kenyan Emergency Alert Bar */}
      <div className="bg-red-600 text-white text-xs md:text-sm font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-inner">
        <ShieldAlert className="w-4.5 h-4.5 animate-pulse shrink-0" />
        <span>IN CRITICAL LIFE-THREATENING EMERGENCIES, CALL KENYAN PARAMEDICS (999 / 112) IMMEDIATELY</span>
        <a
          href="tel:999"
          className="bg-white text-red-700 hover:bg-red-50 px-2 py-0.5 rounded ml-2 text-[11px] font-extrabold flex items-center gap-1 transition-colors"
        >
          <Phone className="w-3 h-3 fill-current" />
          DIAL 999
        </a>
      </div>

      {/* 2. Brand Navigation Header */}
      <header className="max-w-5xl w-full mx-auto px-4 pt-6 pb-2 flex flex-col sm:flex-row gap-4 items-center justify-between z-50">
        <button
          onClick={() => {
            window.speechSynthesis.cancel();
            setActiveGuide(null);
            setDiagnosisSymptoms(null);
          }}
          className="flex items-center gap-3 group text-left focus:outline-none cursor-pointer"
        >
          <div className="w-11 h-11 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none font-display">
              Fast<span className="text-red-600">AId</span>
            </h1>
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-0.5 font-display">
              AI First-Aid Specialist
            </p>
          </div>
        </button>

        {userProfile && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">
              Active: <span className="font-bold text-slate-800">{userProfile.name}</span> ({userProfile.ageBand})
            </span>
            <div className="h-4 w-px bg-slate-200"></div>
            
            {userProfile.name !== "Guest" && (
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-all cursor-pointer"
                title="Edit Profile"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="p-1 hover:bg-slate-100 text-red-600 hover:text-red-700 rounded-lg transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Toast notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-full shadow-lg border border-slate-800 flex items-center gap-2"
          >
            <div className={`w-2 h-2 rounded-full ${toastMessage.type === "success" ? "bg-emerald-500" : "bg-red-500 animate-ping"}`} />
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 relative">
        <AnimatePresence mode="wait">
          {!userProfile ? (
            /* Auth and Profile Creation Stage */
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <AuthAndProfile onComplete={handleProfileComplete} onBypass={handleBypass} />
            </motion.div>
          ) : activeGuide ? (
            /* Active Walking Guide View */
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <EmergencyGuide
                guide={activeGuide}
                character={selectedCharacter}
                onExit={() => {
                  window.speechSynthesis.cancel();
                  setActiveGuide(null);
                }}
              />
            </motion.div>
          ) : diagnosisSymptoms ? (
            /* Interactive Diagnosis Questioning & Assessment Stage */
            <motion.div
              key="diagnosis"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <DiagnosisFlow
                symptoms={diagnosisSymptoms}
                profile={userProfile}
                selectedCharacter={selectedCharacter}
                onStartGuide={handleStartGuideWithCaching}
                onBackToHome={() => setDiagnosisSymptoms(null)}
              />
            </motion.div>
          ) : (
            /* Standard Dashboard Screen */
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Last advice retrieval widget */}
              <div className="flex justify-end px-2">
                <button
                  onClick={handleReviewLastAdvice}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer hover:border-slate-300"
                >
                  <RotateCcw className="w-4 h-4 text-red-600" />
                  <span>Restore Last Emergency Assessment</span>
                </button>
              </div>

              <Dashboard
                characters={CHARACTERS}
                selectedCharacter={selectedCharacter}
                onSelectCharacter={setSelectedCharacter}
                onSelectGuide={handleStartGuideWithCaching}
                onSearchCustom={handleSearchCustom}
                searchLoading={false}
                searchError={null}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* User profile details manager modal */}
      {showProfileModal && userProfile && (
        <UserProfileModal
          profile={userProfile}
          onSave={handleProfileSave}
          onDelete={handleProfileDelete}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* 4. Elegant Disclaimer Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 px-4 mt-12 text-center text-[11px] text-slate-400 leading-relaxed">
        <div className="max-w-xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-1.5 font-bold text-slate-500">
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current animate-pulse" />
            <span>FastAId - Grade 10 Software Project Reference</span>
          </div>
          <p>
            DISCLAIMER: FastAId is an educational training reference. It does not replace professional medical diagnosis, advisory services, or actual medical personnel. In any real emergency, immediately alert local paramedics and emergency services.
          </p>
          <p className="opacity-70">
            Powered by Gemini. Built to support robust offline cached guidelines, custom age-band adaptations, and Kenyan health contact integration.
          </p>
        </div>
      </footer>
    </div>
  );
}
