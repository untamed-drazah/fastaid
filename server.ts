import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

// Lazy initialization of Gemini API Client
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// First Aid Guide JSON Schema
const firstAidSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Descriptive name of the first-aid procedure or emergency guide.",
    },
    dangerLevel: {
      type: Type.STRING,
      description: "The level of danger. Must be one of: 'high', 'medium', 'low'.",
    },
    characterExpression: {
      type: Type.STRING,
      description: "The initial visual expression for the animated character. Must be one of: 'urgent', 'calm', 'caution', 'success', 'talking'.",
    },
    quickWarning: {
      type: Type.STRING,
      description: "A short, prominent warning message (e.g. 'Call 911 immediately!').",
    },
    steps: {
      type: Type.ARRAY,
      description: "Ordered step-by-step procedures to guide the rescuer in real-time.",
      items: {
        type: Type.OBJECT,
        properties: {
          stepNumber: { type: Type.INTEGER },
          title: {
            type: Type.STRING,
            description: "Short, bold, action-oriented title of this step (e.g., 'Apply Direct Pressure').",
          },
          instruction: {
            type: Type.STRING,
            description: "Detailed, simple, easy-to-read instruction text. Use clear sentences.",
          },
          voiceText: {
            type: Type.STRING,
            description: "Extremely concise instruction text designed specifically to be read aloud clearly by a text-to-speech engine.",
          },
          illustrationHint: {
            type: Type.STRING,
            description: "A category hint for visual overlays/SVG diagrams. Must be one of: 'gloves', 'compress', 'elevate', 'pressure_point', 'tourniquet', 'cpr_chest', 'cpr_airway', 'burn_water', 'burn_cover', 'choking_back', 'choking_thrusts', 'default'.",
          },
          durationSeconds: {
            type: Type.INTEGER,
            description: "Optional timer duration for this action in seconds (e.g. 120 for washing a burn, or 300 for direct pressure). Use 0 if there's no timer.",
          },
        },
        required: ["stepNumber", "title", "instruction", "voiceText", "illustrationHint", "durationSeconds"],
      },
    },
  },
  required: ["title", "dangerLevel", "characterExpression", "quickWarning", "steps"],
};

// Interactive Diagnosis JSON Schema
const diagnosisSchema = {
  type: Type.OBJECT,
  properties: {
    isComplete: {
      type: Type.BOOLEAN,
      description: "Set to true if we have sufficient info to make a safe first-aid assessment. Set to false if we need to ask a follow-up question first. IMPORTANT: Only ask up to 2-3 follow-up questions maximum before completing.",
    },
    followUpQuestion: {
      type: Type.OBJECT,
      description: "Provide a single clarifying question if isComplete is false.",
      properties: {
        id: { type: Type.STRING, description: "A unique slug for this question (e.g. 'conscious', 'breathing', 'allergy_trigger')." },
        text: {
          type: Type.STRING,
          description: "A simple, comforting, direct follow-up question tailored perfectly to the user's age band (e.g. very simple and gentle for child, clear for teen, precise for adult).",
        },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "2 to 3 short button options (e.g., ['Yes', 'No', 'Not sure']). Keep options short.",
        },
        isSkippable: { type: Type.BOOLEAN, description: "Whether the user can skip this question." }
      },
      required: ["id", "text", "isSkippable"]
    },
    assessment: {
      type: Type.OBJECT,
      description: "Provide the final assessment and first-aid plan if isComplete is true.",
      properties: {
        likelyCondition: {
          type: Type.STRING,
          description: "The estimated condition (e.g., 'Mild Burn', 'Severe Choking Incident')."
        },
        urgencyLevel: {
          type: Type.STRING,
          description: "Must be one of: 'high', 'medium', 'low'."
        },
        quickWarning: {
          type: Type.STRING,
          description: "Short critical warning (e.g., 'Dial Kenyan Emergency 999 immediately if lips turn blue!')."
        },
        explanation: {
          type: Type.STRING,
          description: "A reassuring explanation of what might be happening, adjusted for the user's age band."
        },
        steps: {
          type: Type.ARRAY,
          description: "Custom ordered step-by-step instructions. Tailor the detail, length, and words directly to the age band.",
          items: {
            type: Type.OBJECT,
            properties: {
              stepNumber: { type: Type.INTEGER },
              title: { type: Type.STRING },
              instruction: { type: Type.STRING, description: "Instruction details adjusted for age band. Children (8-12): simple phrases, Teen (13-17): clear everyday words, Adult (18+): detailed, precise medical safety guidelines." },
              voiceText: { type: Type.STRING, description: "Very short text to read aloud clearly." },
              illustrationHint: {
                type: Type.STRING,
                description: "Must be one of: 'gloves', 'compress', 'elevate', 'pressure_point', 'tourniquet', 'cpr_chest', 'cpr_airway', 'burn_water', 'burn_cover', 'choking_back', 'choking_thrusts', 'default'."
              },
              durationSeconds: { type: Type.INTEGER }
            },
            required: ["stepNumber", "title", "instruction", "voiceText", "illustrationHint", "durationSeconds"]
          }
        }
      },
      required: ["likelyCondition", "urgencyLevel", "quickWarning", "explanation", "steps"]
    }
  },
  required: ["isComplete"]
};

// API Endpoint to perform interactive diagnosing (questions + assessments)
app.post("/api/gemini/diagnose", async (req, res) => {
  const { symptoms, profile, answers } = req.body;
  if (!symptoms || typeof symptoms !== "string") {
    return res.status(400).json({ error: "Missing or invalid symptoms in request body." });
  }

  const ai = getGemini();

  if (!ai) {
    console.log("No valid GEMINI_API_KEY found, returning fallback flag.");
    return res.json({
      fallback: true,
      reason: "No Gemini API Key provided. Using advanced local fallback instead."
    });
  }

  try {
    const profileContext = profile 
      ? `Name: ${profile.name}, Age: ${profile.age} (${profile.ageBand}), Allergies: ${profile.allergies || 'None declared'}, Conditions: ${profile.conditions || 'None declared'}, Medications: ${profile.medications || 'None declared'}`
      : "No profile context provided.";

    const previousAnswersContext = answers && answers.length > 0
      ? answers.map((a: any) => `Q: ${a.questionText} -> A: ${a.answerText}`).join("\n")
      : "No previous follow-up questions answered yet.";

    const prompt = `You are FastAId, an interactive first-aid diagnosing assistant.
Your goal is to safely analyze symptoms, ask at most 2 targeted follow-up questions *one-by-one* if needed, or output a completed, highly tailored first-aid step guideline.

CRITICAL ADAPTATION DIRECTIVES:
The user's age band is "${profile?.ageBand || 'adult'}". You MUST adjust the vocabulary, difficulty, tone, and steps strictly:
- Child (8-12): Use extremely basic, non-scary words, short sentences. Deliver very few, simple steps. Prompt heavily to call an adult or emergency services (Kenyan 999/112).
- Teen (13-17): Use clear, modern everyday language. Moderate detail with escalation cues.
- Adult (18+): Use full, precise, professional and medically-sound first-aid steps.

MEDICAL SAFETY DIRECTIVES:
- Account for the user's medical profile: ${profileContext}. Avoid recommendations that contradict their allergies or medications.
- Do NOT provide a firm clinical diagnosis. Use cautious medical terms (e.g. "Likely Mild Burn" or "Signs of allergic reaction").
- Always include a clear disclaimer and prompt them to contact professional paramedics (Kenyan 999 or Red Cross).

Current user symptoms: "${symptoms}"
Previous question answers so far:
${previousAnswersContext}

If you have enough information, or if you have already asked 2 questions, set isComplete=true and provide the "assessment". Otherwise, set isComplete=false and ask ONE targeted "followUpQuestion".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: diagnosisSchema,
        systemInstruction: "You are FastAId, an interactive, highly empathetic first-aid diagnosis system. You adapt language difficulty perfectly to the patient's age and health background.",
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("Empty text response from Gemini API.");
    }

    const diagnosisData = JSON.parse(textResponse.trim());
    return res.json(diagnosisData);
  } catch (error: any) {
    console.error("Gemini Diagnosis API Error:", error);
    return res.status(500).json({
      error: "Failed to generate AI diagnosis.",
      details: error.message || error,
      fallback: true
    });
  }
});

// API Endpoint to generate custom real-time first-aid instructions
app.post("/api/gemini/guidance", async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing or invalid query in request body." });
  }

  const ai = getGemini();

  if (!ai) {
    console.log("No valid GEMINI_API_KEY found, returning fallback flag.");
    return res.json({
      fallback: true,
      reason: "No Gemini API Key provided. Using advanced local semantic search instead."
    });
  }

  try {
    const prompt = `You are a medical first-aid training assistant named FastAId. Create an immediate, step-by-step real-time emergency guide for the following user emergency query: "${query}".
Keep instructions direct, bite-sized, and designed for someone in a high-stress scenario.
Do NOT use jargon.
For steps that require time (e.g. applying pressure, cooling a burn, checking breathing), specify a recommended duration in 'durationSeconds'.
Always return the structured output following the response schema precisely. Ensure 'dangerLevel' and 'characterExpression' conform exactly to the options requested.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: firstAidSchema,
        systemInstruction: "You are FastAId, an empathetic, clear, and professional real-time first-aid instructor. You break down complex medical procedures into simple, reassuring, step-by-step guidance for emergencies.",
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("Empty text response from Gemini API.");
    }

    const firstAidData = JSON.parse(textResponse.trim());
    return res.json(firstAidData);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      error: "Failed to generate AI first aid guide.",
      details: error.message || error,
      fallback: true
    });
  }
});

// Serve the app using Vite in dev mode, or static files in production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start();
