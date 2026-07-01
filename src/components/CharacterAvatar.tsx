import { motion } from "motion/react";
import { CharacterExpression } from "../types";

interface CharacterAvatarProps {
  expression: CharacterExpression;
  characterId: string; // 'joy', 'sam', 'robo'
  className?: string;
}

export default function CharacterAvatar({
  expression: rawExpression,
  characterId,
  className = "",
}: CharacterAvatarProps) {
  // Normalize data-layer expression aliases to the avatar's render states.
  // Static guides, the diagnosis flow, and the Gemini schema emit "caution"/"calm",
  // but this component only animates "warning"/"calming" — without this map, caution-
  // and calm-level guides render a neutral (idle) face instead of a concerned/soothing one.
  const expression: CharacterExpression =
    rawExpression === "caution"
      ? "warning"
      : (rawExpression as string) === "calm"
      ? "calming"
      : rawExpression;

  // Select color themes
  const getThemeColors = () => {
    switch (characterId) {
      case "sam":
        return {
          skin: "#EAA87A",
          hair: "#C85C17",
          shirt: "#0F766E", // teal paramedic uniform
          accent: "#0D9488",
          bg: "bg-teal-50 border-teal-200",
        };
      case "robo":
        return {
          skin: "#E2E8F0", // metal
          hair: "#475569", // dark metal
          shirt: "#3B82F6", // blue robot plate
          accent: "#60A5FA",
          bg: "bg-blue-50 border-blue-200",
        };
      case "joy":
      default:
        return {
          skin: "#F5C39E",
          hair: "#312E81", // indigo hair
          shirt: "#EC4899", // pink medical coat
          accent: "#F43F5E",
          bg: "bg-rose-50 border-rose-200",
        };
    }
  };

  const colors = getThemeColors();

  // Dynamic expressions background pulses or accessories
  const renderExpressionBackground = () => {
    if (expression === "urgent") {
      return (
        <div className="absolute inset-0 rounded-full bg-rose-500/10 animate-ping duration-1000 pointer-events-none" />
      );
    }
    if (expression === "calming") {
      return (
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse duration-2000 pointer-events-none" />
      );
    }
    if (expression === "warning") {
      return (
        <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse duration-1000 pointer-events-none" />
      );
    }
    return null;
  };

  return (
    <div className={`relative flex items-center justify-center p-4 rounded-full border-4 ${colors.bg} ${className} transition-all duration-500`}>
      {renderExpressionBackground()}

      {/* Sparkles for Success */}
      {expression === "success" && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-yellow-400"
              initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
              animate={{
                scale: [0, 1.2, 0],
                opacity: [1, 1, 0],
                x: [(i % 2 === 0 ? 1 : -1) * (15 + Math.random() * 40), (i % 2 === 0 ? 1 : -1) * (30 + Math.random() * 60)],
                y: [(Math.random() - 0.5) * 80, (Math.random() - 0.5) * 120],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* SVG Avatar Container */}
      <svg
        viewBox="0 0 120 120"
        className="w-32 h-32 md:w-40 md:h-40 filter drop-shadow-md"
      >
        {/* Glow backdrop based on expression */}
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.accent} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        {expression === "success" && (
          <circle cx="60" cy="60" r="55" fill="url(#glow)" />
        )}

        {/* Character Base Head & Body Animation */}
        <motion.g
          animate={{
            y: expression === "urgent" ? [0, -1.5, 0] : [0, -3, 0],
            rotate: expression === "thinking" ? [0, 1, -1, 0] : 0,
          }}
          transition={{
            duration: expression === "urgent" ? 1 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* 1. Shoulders/Shirt */}
          <path
            d="M 25,100 C 25,75 95,75 95,100 Z"
            fill={colors.shirt}
            stroke="#1E293B"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Stethoscope/Badge Detail for Medical/Rescue */}
          {characterId === "joy" && (
            <path
              d="M 45,85 C 45,98 75,98 75,85"
              fill="none"
              stroke="#64748B"
              strokeWidth="2.5"
            />
          )}
          {characterId === "sam" && (
            <circle cx="60" cy="90" r="5" fill="#EF4444" /> // Rescue Star / badge
          )}

          {/* 2. Neck */}
          <rect
            x="52"
            y="65"
            width="16"
            height="15"
            fill={colors.skin}
            stroke="#1E293B"
            strokeWidth="3"
            rx="4"
          />

          {/* 3. Hair (Back) */}
          {characterId === "joy" && (
            <path
              d="M 30,65 C 15,35 105,35 90,65 C 95,85 25,85 30,65 Z"
              fill={colors.hair}
            />
          )}

          {/* 4. Head Circle/Shape */}
          {characterId === "robo" ? (
            // Robot Metallic Boxy Head
            <rect
              x="38"
              y="28"
              width="44"
              height="42"
              rx="10"
              fill={colors.skin}
              stroke="#1E293B"
              strokeWidth="3"
            />
          ) : (
            // Human Round Head
            <circle
              cx="60"
              cy="48"
              r="22"
              fill={colors.skin}
              stroke="#1E293B"
              strokeWidth="3"
            />
          )}

          {/* Ears (Human only) */}
          {characterId !== "robo" && (
            <>
              <circle cx="36" cy="48" r="4.5" fill={colors.skin} stroke="#1E293B" strokeWidth="2.5" />
              <circle cx="84" cy="48" r="4.5" fill={colors.skin} stroke="#1E293B" strokeWidth="2.5" />
            </>
          )}

          {/* Hair (Front/Bangs) */}
          {characterId === "joy" && (
            <path
              d="M 37,35 C 45,24 75,24 83,35 C 85,38 72,32 60,38 C 48,32 35,38 37,35 Z"
              fill={colors.hair}
              stroke="#1E293B"
              strokeWidth="1"
            />
          )}
          {characterId === "sam" && (
            <path
              d="M 36,36 C 45,20 75,20 84,36 C 80,30 40,30 36,36 Z"
              fill={colors.hair}
              stroke="#1E293B"
              strokeWidth="3"
            />
          )}
          {characterId === "robo" && (
            <>
              {/* Antenna for Robot */}
              <line x1="60" y1="28" x2="60" y2="16" stroke="#475569" strokeWidth="3" />
              <circle cx="60" cy="14" r="4" fill="#EF4444" />
            </>
          )}

          {/* 5. Eyebrows */}
          <motion.g
            animate={{
              y: expression === "urgent" ? -2 : expression === "thinking" ? -1.5 : 0,
              rotate: expression === "warning" ? 4 : 0,
            }}
          >
            {characterId !== "robo" ? (
              <>
                {/* Left Eyebrow */}
                <path
                  d="M 46,38 C 50,35 53,36 54,39"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Right Eyebrow */}
                <path
                  d="M 74,38 C 70,35 67,36 66,39"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </>
            ) : (
              // Robot visor or horizontal light lines
              <rect x="44" y="34" width="32" height="3" fill="#475569" rx="1.5" />
            )}
          </motion.g>

          {/* 6. Eyes (Dynamic animation for blinking and emotions) */}
          <g>
            {characterId === "robo" ? (
              // Robot Glowing Digital Eyes
              <>
                <motion.circle
                  cx="50"
                  cy="44"
                  r="5"
                  fill={
                    expression === "urgent" || expression === "warning"
                      ? "#EF4444" // red alert
                      : expression === "success"
                      ? "#10B981" // green success
                      : "#3B82F6" // blue standard
                  }
                  animate={{
                    opacity: expression === "thinking" ? [0.3, 1, 0.3] : [1, 0.8, 1],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.circle
                  cx="70"
                  cy="44"
                  r="5"
                  fill={
                    expression === "urgent" || expression === "warning"
                      ? "#EF4444"
                      : expression === "success"
                      ? "#10B981"
                      : "#3B82F6"
                  }
                  animate={{
                    opacity: expression === "thinking" ? [1, 0.3, 1] : [1, 0.8, 1],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </>
            ) : (
              // Human Expressive Eyes
              <>
                {/* Left Eye */}
                <motion.ellipse
                  cx="50"
                  cy="44"
                  rx="3.5"
                  ry={expression === "calming" ? "1" : "3.5"}
                  fill="#1E293B"
                  animate={
                    expression !== "calming"
                      ? {
                          scaleY: [1, 1, 0.1, 1],
                        }
                      : {}
                  }
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                />
                {/* Right Eye */}
                <motion.ellipse
                  cx="70"
                  cy="44"
                  rx="3.5"
                  ry={expression === "calming" ? "1" : "3.5"}
                  fill="#1E293B"
                  animate={
                    expression !== "calming"
                      ? {
                          scaleY: [1, 1, 0.1, 1],
                        }
                      : {}
                  }
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                />
                {/* Eye Highlights for high-quality cute styling */}
                {expression !== "calming" && (
                  <>
                    <circle cx="48.5" cy="42.5" r="1" fill="#FFFFFF" />
                    <circle cx="68.5" cy="42.5" r="1" fill="#FFFFFF" />
                  </>
                )}
              </>
            )}
          </g>

          {/* 7. Mouth (Moves when talking or responds to expressions) */}
          <g>
            {characterId === "robo" ? (
              // Robot LED grid mouth line
              <motion.line
                x1="48"
                y1="56"
                x2="72"
                y2="56"
                stroke={
                  expression === "urgent" || expression === "warning"
                    ? "#EF4444"
                    : "#10B981"
                }
                strokeWidth="2.5"
                strokeLinecap="round"
                animate={
                  expression === "talking"
                    ? {
                        strokeWidth: [2.5, 5, 1, 4, 2.5],
                        y1: [56, 54, 57, 55, 56],
                        y2: [56, 54, 57, 55, 56],
                      }
                    : {}
                }
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            ) : (
              // Human mouth
              <motion.path
                d={
                  expression === "success"
                    ? "M 52,54 Q 60,61 68,54" // Happy wide smile
                    : expression === "urgent" || expression === "warning"
                    ? "M 54,58 Q 60,54 66,58" // Stressed/worried line
                    : expression === "calming"
                    ? "M 54,56 Q 60,59 66,56" // Gentle, peaceful closed curve
                    : "M 53,56 Q 60,58 67,56" // Normal gentle mouth
                }
                fill="none"
                stroke="#1E293B"
                strokeWidth="3.5"
                strokeLinecap="round"
                animate={
                  expression === "talking"
                    ? {
                        d: [
                          "M 53,56 Q 60,62 67,56", // open wider
                          "M 53,56 Q 60,54 67,56", // narrow
                          "M 53,56 Q 60,65 67,56", // super open
                          "M 53,56 Q 60,58 67,56", // normal
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </g>

          {/* Cheek Blushes for Friendliness */}
          {characterId !== "robo" && expression !== "urgent" && (
            <>
              <circle cx="44" cy="49" r="2.5" fill="#EF4444" opacity="0.15" />
              <circle cx="76" cy="49" r="2.5" fill="#EF4444" opacity="0.15" />
            </>
          )}

          {/* Sweating animation for warning/urgent */}
          {(expression === "urgent" || expression === "warning") && (
            <motion.path
              d="M 83,40 Q 82,45 80,47"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2.5"
              strokeLinecap="round"
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.g>
      </svg>
    </div>
  );
}
