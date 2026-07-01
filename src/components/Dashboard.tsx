import React, { useState } from "react";
import { Search, Heart, ShieldAlert, Zap, Compass, AlertCircle, HelpCircle } from "lucide-react";
import { Character, FirstAidGuide } from "../types";
import CharacterAvatar from "./CharacterAvatar";

interface DashboardProps {
  onSelectGuide: (guide: FirstAidGuide) => void;
  selectedCharacter: Character;
  onSelectCharacter: (char: Character) => void;
  characters: Character[];
  onSearchCustom: (query: string) => Promise<void>;
  searchLoading: boolean;
  searchError: string | null;
}

export default function Dashboard({
  onSelectGuide,
  selectedCharacter,
  onSelectCharacter,
  characters,
  onSearchCustom,
  searchLoading,
  searchError,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchCustom(searchQuery.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    onSearchCustom(suggestion);
  };

  // Quick Action cards with icons and medical guidelines (Bento Gradients & Curvature)
  const QUICK_CARDS = [
    {
      id: "cpr",
      title: "CPR (Adult / Child)",
      desc: "Chest compressions & rescue breaths with metronome support.",
      color: "border-rose-200 bg-gradient-to-br from-rose-50/70 to-white hover:from-rose-100/60 text-rose-950",
      icon: Heart,
      badge: "Urgent (High)",
      iconColor: "text-rose-600 bg-rose-100/80",
    },
    {
      id: "choking",
      title: "Choking Relief",
      desc: "Heimlich maneuver, abdominal thrusts, and back blows.",
      color: "border-amber-200 bg-gradient-to-br from-amber-50/70 to-white hover:from-amber-100/60 text-amber-950",
      icon: ShieldAlert,
      badge: "Urgent (High)",
      iconColor: "text-amber-600 bg-amber-100/80",
    },
    {
      id: "bleeding",
      title: "Severe Bleeding",
      desc: "Pressure bandages, wound compression, elevation, tourniquets.",
      color: "border-red-200 bg-gradient-to-br from-red-50/70 to-white hover:from-red-100/60 text-red-950",
      icon: Zap,
      badge: "Urgent (High)",
      iconColor: "text-red-600 bg-red-100/80",
    },
    {
      id: "burns",
      title: "Thermal Burns",
      desc: "Cooling thermal burns, dressing application, blister management.",
      color: "border-blue-200 bg-gradient-to-br from-blue-50/70 to-white hover:from-blue-100/60 text-blue-950",
      icon: Compass,
      badge: "Medium Risk",
      iconColor: "text-blue-600 bg-blue-100/80",
    },
    {
      id: "poisoning",
      title: "Poisoning",
      desc: "Chemical or toxin ingestion, skin flush, safety procedures.",
      color: "border-purple-200 bg-gradient-to-br from-purple-50/70 to-white hover:from-purple-100/60 text-purple-950",
      icon: AlertCircle,
      badge: "High Risk",
      iconColor: "text-purple-600 bg-purple-100/80",
    },
    {
      id: "fractures",
      title: "Broken Bones",
      desc: "Splinting, R.I.C.E method, fracture support and pain relief.",
      color: "border-slate-200 bg-gradient-to-br from-slate-50/70 to-white hover:from-slate-100/60 text-slate-950",
      icon: HelpCircle,
      badge: "Medium Risk",
      iconColor: "text-slate-600 bg-slate-100/80",
    },
  ];

  const suggestions = [
    "Bee sting & allergic reaction",
    "Sprained ankle (R.I.C.E. method)",
    "Snake bite treatment",
    "Heat stroke cooling",
    "Nosebleed care",
    "Fainting & shock",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* 1. Header with Active Character (Premium Bento Overlay) */}
      <div className="bg-white rounded-[2rem] border border-slate-200/80 p-8 shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-transparent pointer-events-none" />
        
        <div className="relative shrink-0 z-10">
          <CharacterAvatar
            characterId={selectedCharacter.id}
            expression={searchLoading ? "thinking" : "idle"}
          />
        </div>
        
        <div className="space-y-4 text-center md:text-left flex-1 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-bold tracking-tight">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            Interactive Rescue Guidance Coach
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
            Hi, I'm <span className="text-red-600">{selectedCharacter.name}</span>!
          </h2>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            I am here to guide you step-by-step through any first aid scenario. I can speak
            instructions out loud, show visual overlay guides, and run interactive timers or metronomes to assist you.
          </p>

          {/* Character Selector Pills */}
          <div className="pt-2">
            <span className="text-[10px] font-black text-slate-400 tracking-widest block mb-2.5 uppercase font-display">
              Select Your Specialist Coach:
            </span>
            <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
              {characters.map((char) => {
                const isSelected = char.id === selectedCharacter.id;
                return (
                  <button
                    key={char.id}
                    onClick={() => onSelectCharacter(char)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 ${
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20 scale-102"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: char.avatarColor }}
                    />
                    {char.name} <span className="opacity-70 font-medium">({char.role})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Custom AI Search / Query Box (Deep Dark Bento Module) */}
      <div className="bg-slate-950 text-white rounded-[2rem] p-8 md:p-10 border border-slate-850 shadow-2xl relative overflow-hidden">
        {/* Sleek radial glowing gradient */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <div className="text-red-400 text-xs font-black uppercase tracking-widest font-display">Dynamic Patient Diagnosis</div>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display">AI Emergency Assistant</h3>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-2xl">
              Describe your specific emergency context below (e.g. "Toddler fell off bed and bumped head" or "What to do for severe nosebleed"). Our dynamic model generates tailored instructions instantly.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Describe what happened as clearly as possible..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={searchLoading}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading || !searchQuery.trim()}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl px-8 py-4 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 hover:shadow-red-900/50 active:scale-98 transition-all font-display shrink-0"
            >
              {searchLoading ? (
                <>
                  <span className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Generating Protocols...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-white animate-pulse" />
                  <span>Generate Guide</span>
                </>
              )}
            </button>
          </form>

          {searchError && (
            <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Quick query chips */}
          <div className="space-y-3 pt-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-display block">
              SUGGESTED DIAGNOSTIC ENQUIRIES:
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  disabled={searchLoading}
                  className="text-xs bg-slate-900 hover:bg-slate-850 text-slate-300 px-3.5 py-2 rounded-xl border border-slate-850 hover:border-slate-800 transition-all text-left font-sans cursor-pointer hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Common Quick Actions Grid (Beautiful Asymmetric Grid Feel) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <span>Instant Emergency Protocols</span>
          </h3>
          <span className="text-slate-500 text-xs font-bold font-display uppercase tracking-wider">Ready to Launch</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {QUICK_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={async () => {
                  // Retrieve the static guide
                  const { STATIC_GUIDES } = await import("../data/staticProcedures");
                  const guide = STATIC_GUIDES[card.id];
                  if (guide) onSelectGuide(guide);
                }}
                className={`p-6 rounded-[2rem] border text-left flex flex-col justify-between h-48 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group ${card.color}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-2.5 rounded-xl border border-slate-100 shadow-sm group-hover:scale-110 transition-transform duration-300 ${card.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/80 text-slate-700 shadow-xs border border-slate-100">
                    {card.badge}
                  </span>
                </div>
                <div className="space-y-2 mt-4">
                  <h4 className="font-extrabold text-base tracking-tight leading-tight text-slate-900 font-display">
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {card.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
