import { FirstAidGuide } from "../types";

export const STATIC_GUIDES: Record<string, FirstAidGuide> = {
  cpr: {
    title: "Cardiopulmonary Resuscitation (CPR)",
    dangerLevel: "high",
    characterExpression: "urgent",
    quickWarning: "Ensure the scene is safe! Call emergency services (911) and get an AED immediately before starting compressions.",
    steps: [
      {
        stepNumber: 1,
        title: "Check Response & Breathing",
        instruction: "Tap the shoulders and shout loudly: 'Are you okay?'. Look, listen, and feel for chest rise or breathing for no more than 10 seconds.",
        voiceText: "Tap the shoulder and shout 'Are you okay?'. Check if they are breathing normally. If not, proceed to compressions.",
        illustrationHint: "default",
        durationSeconds: 10
      },
      {
        stepNumber: 2,
        title: "Position Your Hands on the Chest",
        instruction: "Place the heel of one hand in the center of the chest (lower half of the breastbone). Interlock your other hand on top, keeping your elbows locked and shoulders directly over your hands.",
        voiceText: "Place the heel of one hand in the center of their chest. Interlock your other hand on top. Keep your arms straight and elbows locked.",
        illustrationHint: "cpr_chest",
        durationSeconds: 0
      },
      {
        stepNumber: 3,
        title: "Perform 30 Chest Compressions",
        instruction: "Push hard and fast! Compress the chest at least 2 inches deep at a rate of 100 to 120 compressions per minute. (Use our metronome below to keep the correct rhythm!). Allow the chest to fully recoil after each push.",
        voiceText: "Compress the chest thirty times, hard and fast, to the beat of the metronome.",
        illustrationHint: "cpr_chest",
        durationSeconds: 0
      },
      {
        stepNumber: 4,
        title: "Open Airway & Give 2 Rescue Breaths",
        instruction: "Tilt the head back slightly and lift the chin. Pinch the nose shut, take a normal breath, seal your mouth over theirs, and blow for 1 second. Ensure the chest rises, then repeat for a second breath.",
        voiceText: "Tilt the head back, lift the chin, pinch the nose, and give two normal rescue breaths.",
        illustrationHint: "cpr_airway",
        durationSeconds: 0
      },
      {
        stepNumber: 5,
        title: "Repeat the Cycles (30:2)",
        instruction: "Continue cycles of 30 chest compressions and 2 rescue breaths without interruption. Do not stop until professional medical help arrives, an AED is ready to use, or the person starts breathing.",
        voiceText: "Continue giving thirty compressions followed by two breaths. Keep going until professional help arrives.",
        illustrationHint: "cpr_chest",
        durationSeconds: 0
      }
    ]
  },
  choking: {
    title: "Choking Relief (Heimlich Maneuver)",
    dangerLevel: "high",
    characterExpression: "urgent",
    quickWarning: "Act fast. If the person can cough or speak, encourage them to keep coughing. If they cannot make a sound, proceed immediately.",
    steps: [
      {
        stepNumber: 1,
        title: "Assess Choking & Ask Permission",
        instruction: "Ask: 'Are you choking? Can I help you?'. If they nod yes and cannot speak, cough, or breathe, position yourself to give help.",
        voiceText: "Ask if they are choking and if you can help. If they cannot speak or breathe, prepare to assist.",
        illustrationHint: "default",
        durationSeconds: 0
      },
      {
        stepNumber: 2,
        title: "Give 5 Back Blows",
        instruction: "Stand slightly behind the person. Lean them forward so their chest is parallel to the ground. Use the heel of your hand to deliver 5 sharp blows between their shoulder blades.",
        voiceText: "Lean them forward and use the heel of your hand to give five sharp blows between their shoulder blades.",
        illustrationHint: "choking_back",
        durationSeconds: 0
      },
      {
        stepNumber: 3,
        title: "Give 5 Abdominal Thrusts (Heimlich)",
        instruction: "Stand fully behind them. Wrap your arms around their waist. Make a fist with one hand and place the thumb side slightly above their navel. Grasp the fist with your other hand and press in and up with quick, sharp thrusts.",
        voiceText: "Stand behind them, wrap your arms around their waist. Place your fist above their belly button and pull inward and upward five times.",
        illustrationHint: "choking_thrusts",
        durationSeconds: 0
      },
      {
        stepNumber: 4,
        title: "Alternate Blows and Thrusts",
        instruction: "Repeat the sequence of 5 back blows followed by 5 abdominal thrusts. Continue until the object is expelled, or the person becomes unresponsive (if they become unresponsive, start CPR immediately).",
        voiceText: "Alternate five back blows and five belly thrusts until the object comes out.",
        illustrationHint: "default",
        durationSeconds: 0
      }
    ]
  },
  bleeding: {
    title: "Severe Bleeding Control",
    dangerLevel: "high",
    characterExpression: "urgent",
    quickWarning: "Call emergency services immediately if the bleeding is rapid, spurting, or does not slow down within a few minutes.",
    steps: [
      {
        stepNumber: 1,
        title: "Ensure Safety & Put on Gloves",
        instruction: "Ensure the area is safe. Put on disposable medical gloves if available to protect against bloodborne pathogens. Reassure the victim.",
        voiceText: "Put on medical gloves if you have them, and make sure the area is safe.",
        illustrationHint: "gloves",
        durationSeconds: 0
      },
      {
        stepNumber: 2,
        title: "Apply Direct Pressure",
        instruction: "Place a sterile dressing, clean cloth, or gauze over the wound. Press firmly with both hands directly on top of the wound to stem the blood flow.",
        voiceText: "Place a sterile dressing or clean cloth on the wound, and apply firm, continuous pressure with both hands.",
        illustrationHint: "compress",
        durationSeconds: 300 // 5 minutes timer
      },
      {
        stepNumber: 3,
        title: "Elevate the Limb & Maintain Pressure",
        instruction: "If the wound is on an arm or leg, elevate it above the level of the heart while maintaining steady pressure, unless you suspect a broken bone.",
        voiceText: "If it is an arm or leg, elevate it above the heart while keeping the pressure on the wound.",
        illustrationHint: "elevate",
        durationSeconds: 0
      },
      {
        stepNumber: 4,
        title: "Apply a Firm Bandage",
        instruction: "Wrap a bandage firmly around the dressing to hold it in place. Ensure it is snug but not tight enough to cut off circulation completely (check for cold fingers/toes).",
        voiceText: "Wrap a bandage firmly over the dressing to hold it in place, making sure it is snug but not too tight.",
        illustrationHint: "compress",
        durationSeconds: 0
      },
      {
        stepNumber: 5,
        title: "If Bleeding Doesn't Stop: Apply Tourniquet",
        instruction: "If severe, life-threatening bleeding from a limb continues, apply a commercial tourniquet high and tight (2-3 inches above the wound, but not on a joint). Tighten until bleeding stops. Note the exact application time.",
        voiceText: "If bleeding continues and is life-threatening, apply a tourniquet high and tight above the wound, and write down the exact time.",
        illustrationHint: "tourniquet",
        durationSeconds: 0
      }
    ]
  },
  burns: {
    title: "Thermal Burn First Aid",
    dangerLevel: "medium",
    characterExpression: "caution",
    quickWarning: "For severe, deep (third-degree) burns, or burns covering a large area, face, hands, or joints, call 911 immediately. Do NOT apply ice directly.",
    steps: [
      {
        stepNumber: 1,
        title: "Cool the Burn Immediately",
        instruction: "Hold the burned area under cool (not freezing), gently running tap water for at least 10 minutes. This stops the burning process and relieves pain.",
        voiceText: "Cool the burn under cool, running tap water immediately for at least ten minutes. Do not use ice.",
        illustrationHint: "burn_water",
        durationSeconds: 600 // 10 minutes
      },
      {
        stepNumber: 2,
        title: "Remove Jewelry or Restrictive Clothing",
        instruction: "Gently remove rings, bracelets, or tight clothing from the burned limb before swelling begins. Do NOT peel away clothing stuck to the burn.",
        voiceText: "Gently remove any rings or tight clothing near the burn before the area starts to swell.",
        illustrationHint: "default",
        durationSeconds: 0
      },
      {
        stepNumber: 3,
        title: "Protect with a Dry, Sterile Cover",
        instruction: "Cover the burn loosely with a sterile gauze bandage or clean plastic cling wrap. This protects the area from infection and reduces exposure to air.",
        voiceText: "Cover the burned area loosely with a dry, sterile bandage or clean plastic wrap.",
        illustrationHint: "burn_cover",
        durationSeconds: 0
      },
      {
        stepNumber: 4,
        title: "Do Not Pop Blisters",
        instruction: "Avoid popping any blisters that form, as intact skin provides a natural barrier against infection. If a blister breaks, wash gently with water and apply antibiotic ointment.",
        voiceText: "Do not pop any blisters. This protects the area from infection.",
        illustrationHint: "default",
        durationSeconds: 0
      }
    ]
  },
  poisoning: {
    title: "Poisoning Emergency Care",
    dangerLevel: "high",
    characterExpression: "urgent",
    quickWarning: "Call Poison Control (1-800-222-1222 in US) or emergency services immediately. Do NOT induce vomiting unless instructed by medical staff.",
    steps: [
      {
        stepNumber: 1,
        title: "Identify the Substance & Check Safety",
        instruction: "Try to determine what was swallowed, inhaled, or touched, and how much. Keep the container handy for emergency medical professionals.",
        voiceText: "Try to identify what substance was involved and how much was taken. Keep the package or bottle with you.",
        illustrationHint: "default",
        durationSeconds: 0
      },
      {
        stepNumber: 2,
        title: "Assess Responsiveness & Clear Mouth",
        instruction: "If the person swallowed something, check their mouth and remove any remaining pill fragments or material. If they are unresponsive, check breathing and start CPR if needed.",
        voiceText: "If they swallowed something, check their mouth and remove any leftover pieces.",
        illustrationHint: "default",
        durationSeconds: 0
      },
      {
        stepNumber: 3,
        title: "Rinse with Water (Swallowed or Contact)",
        instruction: "If the poison is on the skin or eyes, flush gently with lukewarm running water for 15 minutes. If swallowed and they are conscious and alert, have them rinse their mouth with water.",
        voiceText: "If on skin or eyes, flush with lukewarm water for fifteen minutes. If swallowed, have them rinse their mouth.",
        illustrationHint: "burn_water",
        durationSeconds: 900 // 15 mins
      },
      {
        stepNumber: 4,
        title: "Position to Prevent Choking",
        instruction: "If the person feels dizzy or vomits, place them on their side in the recovery position (knees bent, head tilted back slightly) to keep their airway open.",
        voiceText: "If they vomit or feel drowsy, roll them onto their side in the recovery position to prevent choking.",
        illustrationHint: "default",
        durationSeconds: 0
      }
    ]
  },
  fractures: {
    title: "Fractures and Splinting Guide",
    dangerLevel: "medium",
    characterExpression: "caution",
    quickWarning: "Do NOT attempt to realign or push back a bone that is protruding from the skin. Call emergency services and control bleeding first.",
    steps: [
      {
        stepNumber: 1,
        title: "Control Bleeding & Assess Injury",
        instruction: "If there is an open wound, apply gentle, direct pressure with a sterile dressing to control bleeding. Do not press directly on the broken bone.",
        voiceText: "If there is bleeding, apply gentle pressure around the wound, but do not touch or press the broken bone itself.",
        illustrationHint: "compress",
        durationSeconds: 0
      },
      {
        stepNumber: 2,
        title: "Immobilize the Injured Area",
        instruction: "Keep the injured limb as still as possible. Do not attempt to move the person unless they are in immediate danger.",
        voiceText: "Keep the injured limb completely still. Do not try to move the person.",
        illustrationHint: "default",
        durationSeconds: 0
      },
      {
        stepNumber: 3,
        title: "Apply a Splint",
        instruction: "If help is delayed, support the limb with rolled-up magazines, wooden boards, or folded cardboard. Place the splint above and below the joints surrounding the fracture, and secure loosely with bandages or cloth.",
        voiceText: "Support the broken limb by putting a temporary splint like sturdy cardboard under it. Tie it loosely so you do not stop circulation.",
        illustrationHint: "default",
        durationSeconds: 0
      },
      {
        stepNumber: 4,
        title: "Apply Cold Compress",
        instruction: "Wrap an ice pack or bag of frozen vegetables in a towel. Place it on the injured area for up to 15-20 minutes to reduce pain and swelling.",
        voiceText: "Wrap an ice pack in a towel and apply it gently to the injury to help with swelling and pain.",
        illustrationHint: "default",
        durationSeconds: 1200 // 20 minutes
      }
    ]
  }
};

// Help match user search queries to static procedures when Gemini is unavailable
export function searchStaticGuides(query: string): FirstAidGuide | null {
  const normalized = query.toLowerCase();
  if (normalized.includes("cpr") || normalized.includes("resuscitation") || normalized.includes("chest compression")) {
    return STATIC_GUIDES.cpr;
  }
  if (normalized.includes("choke") || normalized.includes("choking") || normalized.includes("heimlich") || normalized.includes("swallow")) {
    return STATIC_GUIDES.choking;
  }
  if (normalized.includes("bleed") || normalized.includes("blood") || normalized.includes("cut") || normalized.includes("wound") || normalized.includes("hemorrhage")) {
    return STATIC_GUIDES.bleeding;
  }
  if (normalized.includes("burn") || normalized.includes("scalding") || normalized.includes("fire")) {
    return STATIC_GUIDES.burns;
  }
  if (normalized.includes("poison") || normalized.includes("toxin") || normalized.includes("chemical") || normalized.includes("swallowed soap") || normalized.includes("ingest")) {
    return STATIC_GUIDES.poisoning;
  }
  if (normalized.includes("fracture") || normalized.includes("broken bone") || normalized.includes("splint") || normalized.includes("bone")) {
    return STATIC_GUIDES.fractures;
  }
  return null;
}
