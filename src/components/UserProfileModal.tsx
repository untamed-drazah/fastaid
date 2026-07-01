import React, { useState } from "react";
import { UserProfile, AgeBand } from "../types";
import { X, User, ShieldAlert, Key, Heart, Info, Trash2 } from "lucide-react";

interface UserProfileModalProps {
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function UserProfileModal({
  profile,
  onSave,
  onDelete,
  onClose,
}: UserProfileModalProps) {
  const [name, setName] = useState(profile.name);
  const [ageStr, setAgeStr] = useState(profile.age.toString());
  const [password, setPassword] = useState(profile.password || "");
  const [allergies, setAllergies] = useState(profile.allergies || "");
  const [conditions, setConditions] = useState(profile.conditions || "");
  const [medications, setMedications] = useState(profile.medications || "");
  const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact || "");
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    const age = parseInt(ageStr);
    if (isNaN(age) || age < 8 || age > 120) {
      setError("Age must be a number between 8 and 120.");
      return;
    }

    let ageBand: AgeBand = "adult";
    if (age >= 8 && age <= 12) ageBand = "child";
    else if (age >= 13 && age <= 17) ageBand = "teen";

    const updatedProfile: UserProfile = {
      name: name.trim(),
      age,
      ageBand,
      allergies: allergies.trim() || undefined,
      conditions: conditions.trim() || undefined,
      medications: medications.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
      password: password.trim() || undefined,
    };

    onSave(updatedProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-[2rem] max-w-md w-full p-8 border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-950 text-white rounded-lg flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 font-display">Manage Active Profile</h4>
              <p className="text-[10px] text-slate-400 font-medium">Update medical history context or delete your local profile.</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto py-6 pr-1 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="profile-edit-form" className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">Age ({profile.ageBand} group)</label>
              <input
                type="number"
                required
                min="8"
                max="120"
                value={ageStr}
                onChange={(e) => setAgeStr(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">Known Allergies</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">Existing Conditions</label>
              <input
                type="text"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">Current Medications</label>
              <input
                type="text"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display block">Emergency Contact</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>
          </form>

          {/* Delete Section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h5 className="text-xs font-bold text-red-600 font-display">Danger Zone</h5>
            <p className="text-[10px] text-slate-400">Permanently delete this account and all cached health history records from this device.</p>
            
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account Profile</span>
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-3 text-left">
                <p className="text-xs font-bold text-red-900">Are you absolutely sure?</p>
                <p className="text-[10px] text-red-700 leading-normal">This action is irreversible. All local background profile credentials will be deleted.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onDelete}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer"
                  >
                    Yes, Delete Permanent
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    No, Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-slate-100 pt-4 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
          <button
            type="submit"
            form="profile-edit-form"
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
