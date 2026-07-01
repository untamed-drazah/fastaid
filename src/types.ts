export type DangerLevel = 'high' | 'medium' | 'low';

export type CharacterExpression = 'idle' | 'talking' | 'thinking' | 'warning' | 'calming' | 'success' | 'urgent' | 'caution';

export type AgeBand = 'child' | 'teen' | 'adult';

export interface UserProfile {
  name: string;
  age: number;
  allergies?: string;
  conditions?: string;
  medications?: string;
  emergencyContact?: string;
  password?: string;
  ageBand: AgeBand;
}

export interface FirstAidStep {
  stepNumber: number;
  title: string;
  instruction: string;
  voiceText: string;
  illustrationHint: 
    | 'gloves'
    | 'compress'
    | 'elevate'
    | 'pressure_point'
    | 'tourniquet'
    | 'cpr_chest'
    | 'cpr_airway'
    | 'burn_water'
    | 'burn_cover'
    | 'choking_back'
    | 'choking_thrusts'
    | 'default';
  durationSeconds: number; // 0 means no timer
}

export interface FirstAidGuide {
  title: string;
  dangerLevel: DangerLevel;
  characterExpression: CharacterExpression;
  quickWarning: string;
  steps: FirstAidStep[];
}

export interface DiagnosticQuestion {
  id: string;
  text: string;
  options?: string[];
  isSkippable: boolean;
}

export interface AssessmentResult {
  likelyCondition: string;
  urgencyLevel: DangerLevel;
  quickWarning: string;
  explanation: string;
  steps: FirstAidStep[];
}

export interface Character {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  description: string;
  voiceGender: 'male' | 'female';
  voicePitch: number;
  voiceRate: number;
}

