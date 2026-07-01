import React, { useState } from "react";
import { motion } from "motion/react";
import { UserProfile, AgeBand } from "../types";
import { ShieldAlert, Heart, Activity, User, Eye, EyeOff, Key, Zap, Info } from "lucide-react";

interface AuthAndProfileProps {
  onComplete: (profile: UserProfile) => void;
  onBypass: () => void;
}

export default function AuthAndProfile({ onComplete, onBypass }: AuthAndProfileProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [ageStr, setAgeStr] = useState("");
  const [password, setPassword] = useState("");
  const [allergies, setAllergies] = useState("");
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick lookup from localStorage
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }

    const cleanedName = name.trim().toLowerCase();

    if (isLogin) {
      const stored = localStorage.getItem(`fastaid_profile_${cleanedName}`);
      if (!stored) {
        setError("Profile not found. Please register a new profile first!");
        return;
      }
      try {
        const parsed: UserProfile = JSON.parse(stored);
        if (parsed.password !== password) {
          setError("Incorrect password. Please try again.");
          return;
        }
        onComplete(parsed);
      } catch (err) {
        setError("Error loading saved profile.");
      }
    } else {
      // Registering
      const age = parseInt(ageStr);
      if (isNaN(age) || age < 8 || age > 120) {
        setError("Age must be a number between 8 and 120.");
        return;
      }

      // Compute age band
      let ageBand: AgeBand = "adult";
      if (age >= 8 && age <= 12) ageBand = "child";
      else if (age >= 13 && age <= 17) ageBand = "teen";

      const newProfile: UserProfile = {
        name: name.trim(),
        age,
        ageBand,
        allergies: allergies.trim() || undefined,
        conditions: conditions.trim() || undefined,
        medications: medications.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        password,
      };

      localStorage.setItem(`fastaid_profile_${cleanedName}`, JSON.stringify(newProfile));
      localStorage.setItem("fastaid_last_profile", cleanedName);
      onComplete(newProfile);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12 bg-white rounded-[2rem] border border-slate-200/80 shadow-2xl p-8 md:p-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-transparent pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-red-600/30">
            <Activity className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">
            Fast<span className="text-red-600">AId</span> Account
          </h2>
          <p className="text-slate-500 text-xs font-medium max-w-xs mx-auto">
            Secure your medical background profile to unlock tailored age-appropriate assistance and dynamic diagnostics.
          </p>
        </div>

        {/* Bypass Mode Warning */}
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-left flex gap-3 text-red-950">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-wider font-display">EXTREME MEDICAL EMERGENCY?</p>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Do not waste time filling forms in life-threatening scenarios. Access instantaneous rescue guides immediately.
            </p>
            <button
              type="button"
              onClick={onBypass}
              className="text-xs font-extrabold text-red-600 hover:text-red-700 underline block cursor-pointer"
            >
              Skip Registration &amp; Bypass &rarr;
            </button>
          </div>
        </div>

        {/* Toggle State Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/50">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isLogin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign In Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isLogin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Create Profile
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">
              Profile Name / Nickname
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Aisha, Brian, Mr. Otieno"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-900 focus:outline-none focus:border-red-500 transition-all font-sans"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">
                User Age (Drives difficulty)
              </label>
              <input
                type="number"
                required
                min="8"
                max="120"
                placeholder="Required (e.g. 10 for child, 15 for teen, 32 for adult)"
                value={ageStr}
                onChange={(e) => setAgeStr(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-900 focus:outline-none focus:border-red-500 transition-all font-sans"
              />
              <span className="text-[10px] text-slate-400 block pt-0.5">
                Adapts language for Child (8-12), Teen (13-17), or Adult (18+).
              </span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">
              Profile Access Key (Password)
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-xs text-slate-900 focus:outline-none focus:border-red-500 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4 pt-2 border-t border-slate-100"
            >
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">
                    Known Allergies
                  </label>
                  <span className="text-[9px] text-slate-400 font-semibold font-sans">Optional but recommended</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Peanuts, Penicillin, None"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 focus:outline-none focus:border-red-500 transition-all font-sans"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">
                    Existing Conditions
                  </label>
                  <span className="text-[9px] text-slate-400 font-semibold font-sans">Optional but recommended</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Asthma, Diabetes, None"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 focus:outline-none focus:border-red-500 transition-all font-sans"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">
                    Current Medications
                  </label>
                  <span className="text-[9px] text-slate-400 font-semibold font-sans">Optional but recommended</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Inhaler, Insulin, None"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 focus:outline-none focus:border-red-500 transition-all font-sans"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">
                    Emergency Contact Number
                  </label>
                  <span className="text-[9px] text-slate-400 font-semibold font-sans">Optional but recommended</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. +254 712 345678"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 focus:outline-none focus:border-red-500 transition-all font-sans"
                />
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl py-3.5 text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-red-900/10 hover:shadow-red-900/20 active:scale-[0.99] transition-all font-display mt-6 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current text-white animate-pulse" />
            <span>{isLogin ? "Authenticate & Get Started" : "Register Profile"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
