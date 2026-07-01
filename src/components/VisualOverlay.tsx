import React, { useRef, useState, useMemo, Component, ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Camera, Eye, BoxSelect, Activity } from "lucide-react";

/* ----------------------------------------------------------------------------
   Graceful degradation for the 3D guide.
   The scene needs a WebGL context. Some browsers/devices (locked-down mobile,
   low-end hardware, software-rendering environments) can't provide one, and
   react-three-fiber will otherwise retry endlessly and leave a blank box.
   We detect support up-front AND wrap the Canvas in an error boundary so a
   runtime context loss still falls back cleanly instead of crashing the guide.
---------------------------------------------------------------------------- */
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return (
      !!window.WebGLRenderingContext &&
      !!(canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

class CanvasErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

interface VisualOverlayProps {
  hint:
    | "gloves" | "compress" | "elevate" | "pressure_point" | "tourniquet"
    | "cpr_chest" | "cpr_airway" | "burn_water" | "burn_cover"
    | "choking_back" | "choking_thrusts" | "default" | string;
}

/* ----------------------------------------------------------------------------
   Palette — warm, human, calm. Skin tones instead of alarm-red bodies.
   Red is reserved ONLY for the small "focus" indicator on the rescuer's hands.
---------------------------------------------------------------------------- */
const SKIN = "#E8B98F";        // patient skin
const SKIN_R = "#D9A074";      // rescuer skin (slightly different so they read apart)
const HAIR = "#4A3526";
const HAIR_R = "#2E2018";
const SHIRT = "#5B8DEF";       // patient clothing (calm blue)
const SHIRT_DK = "#3E63C7";    // patient lower body (deeper blue — keeps patient one colour, distinct from rescuer)
const SCRUBS = "#178A7E";      // rescuer teal scrubs (matches app theme)
const SCRUBS_DK = "#0F6F65";
const FLOOR = "#EAF0F2";
const FOCUS = "#EF4444";       // focus glow only

/* Reusable materials (memoized once) */
function useMaterials() {
  return useMemo(() => ({
    skin: new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.55, metalness: 0.0 }),
    skinR: new THREE.MeshStandardMaterial({ color: SKIN_R, roughness: 0.55 }),
    hair: new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.7 }),
    hairR: new THREE.MeshStandardMaterial({ color: HAIR_R, roughness: 0.7 }),
    shirt: new THREE.MeshStandardMaterial({ color: SHIRT, roughness: 0.6 }),
    shirtDk: new THREE.MeshStandardMaterial({ color: SHIRT_DK, roughness: 0.6 }),
    scrubs: new THREE.MeshStandardMaterial({ color: SCRUBS, roughness: 0.6 }),
    scrubsDk: new THREE.MeshStandardMaterial({ color: SCRUBS_DK, roughness: 0.6 }),
    focus: new THREE.MeshStandardMaterial({ color: FOCUS, emissive: FOCUS, emissiveIntensity: 0.35, roughness: 0.4 }),
    mat: new THREE.MeshStandardMaterial({ color: "#D5DEE3", roughness: 0.9 }),
  }), []);
}

/* Small helpers ----------------------------------------------------------- */
function Limb({ from, to, radius, material }: { from: [number,number,number]; to: [number,number,number]; radius: number; material: THREE.Material; }) {
  // capsule oriented from A to B
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
  return (
    <mesh position={mid.toArray()} quaternion={quat} castShadow receiveShadow material={material}>
      <capsuleGeometry args={[radius, len, 8, 16]} />
    </mesh>
  );
}

/* A full stylized human. `pose` selects limb arrangement.
   Built from capsules + spheres → rounded, natural, friendly. */
function Human({
  pose, M, variant = "patient", headRef, hideArms = false,
}: {
  pose: "supine" | "stand" | "lean" | "sit";
  M: ReturnType<typeof useMaterials>;
  variant?: "patient" | "rescuer";
  headRef?: React.RefObject<THREE.Group | null>;
  hideArms?: boolean; // drop the default arms when a scene supplies its own (e.g. thrusts/back-blows)
}) {
  const skin = variant === "patient" ? M.skin : M.skinR;
  const hair = variant === "patient" ? M.hair : M.hairR;
  const cloth = variant === "patient" ? M.shirt : M.scrubs;
  // Lower body keeps each figure a single colour so the patient never blends into the rescuer.
  const lower = variant === "patient" ? M.shirtDk : M.scrubsDk;

  if (pose === "supine") {
    // lying on back, head to -z
    return (
      <group>
        {/* head — grouped at the neck pivot so a scene can tilt it (e.g. airway head-tilt).
            The hair cap is rotated to wrap the crown (−z) instead of sitting on top like a
            standing head, which otherwise looks like a floating tuft on a lying patient. */}
        <group ref={headRef} position={[0, 0.5, -1.75]}>
          <mesh position={[0, 0.05, -0.35]} castShadow material={skin}><sphereGeometry args={[0.42, 32, 32]} /></mesh>
          <mesh position={[0, 0.02, -0.45]} rotation={[-Math.PI / 2, 0, 0]} castShadow material={hair}><sphereGeometry args={[0.45, 32, 32, 0, Math.PI*2, 0, Math.PI*0.55]} /></mesh>
        </group>
        {/* neck */}
        <Limb from={[0,0.5,-1.75]} to={[0,0.5,-1.55]} radius={0.16} material={skin} />
        {/* torso (chest→hip) — capsule's long axis is Y by default, so rotate it to lie
            flat along Z (head→hips). Without this the supine torso stands up like a pillar. */}
        <mesh position={[0, 0.5, -0.55]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow material={cloth}>
          <capsuleGeometry args={[0.5, 1.5, 12, 24]} />
          <meshStandardMaterial attach="material" color={variant==="patient"?SHIRT:SCRUBS} roughness={0.6} />
        </mesh>
        {/* hips */}
        <mesh position={[0,0.48,0.5]} castShadow material={lower}><sphereGeometry args={[0.45,24,24]} /></mesh>
        {/* arms at sides */}
        <Limb from={[-0.5,0.5,-0.9]} to={[-0.75,0.45,0.2]} radius={0.16} material={skin} />
        <Limb from={[0.5,0.5,-0.9]} to={[0.75,0.45,0.2]} radius={0.16} material={skin} />
        {/* legs */}
        <Limb from={[-0.22,0.45,0.7]} to={[-0.28,0.4,2.4]} radius={0.2} material={lower} />
        <Limb from={[0.22,0.45,0.7]} to={[0.28,0.4,2.4]} radius={0.2} material={lower} />
        {/* feet */}
        <mesh position={[-0.28,0.45,2.6]} castShadow material={skin}><sphereGeometry args={[0.2,16,16]} /></mesh>
        <mesh position={[0.28,0.45,2.6]} castShadow material={skin}><sphereGeometry args={[0.2,16,16]} /></mesh>
      </group>
    );
  }

  if (pose === "stand" || pose === "lean") {
    const tilt = pose === "lean" ? 0.5 : 0;
    return (
      <group rotation={[tilt, 0, 0]}>
        <mesh position={[0, 3.3, 0]} castShadow material={skin}><sphereGeometry args={[0.42, 32, 32]} /></mesh>
        <mesh position={[0, 3.48, -0.05]} castShadow material={hair}><sphereGeometry args={[0.44, 32, 32, 0, Math.PI*2, 0, Math.PI*0.55]} /></mesh>
        <Limb from={[0,2.85,0]} to={[0,3.0,0]} radius={0.16} material={skin} />
        {/* torso */}
        <mesh position={[0, 2.1, 0]} castShadow material={cloth}><capsuleGeometry args={[0.5, 1.4, 12, 24]} /></mesh>
        {/* hips */}
        <mesh position={[0,1.35,0]} castShadow material={lower}><sphereGeometry args={[0.46,24,24]} /></mesh>
        {/* arms hanging slightly forward */}
        {!hideArms && (
          <>
            <Limb from={[-0.55,2.6,0.05]} to={[-0.7,1.5,0.35]} radius={0.15} material={skin} />
            <Limb from={[0.55,2.6,0.05]} to={[0.7,1.5,0.35]} radius={0.15} material={skin} />
          </>
        )}
        {/* legs */}
        <Limb from={[-0.25,1.3,0]} to={[-0.28,0.05,0]} radius={0.19} material={lower} />
        <Limb from={[0.25,1.3,0]} to={[0.28,0.05,0]} radius={0.19} material={lower} />
        <mesh position={[-0.28,0.05,0.18]} castShadow material={skin}><sphereGeometry args={[0.2,16,16]} /></mesh>
        <mesh position={[0.28,0.05,0.18]} castShadow material={skin}><sphereGeometry args={[0.2,16,16]} /></mesh>
      </group>
    );
  }

  // sit (rescuer kneeling) — compact. Torso leans forward (rot 0.3), so the head must sit
  // forward over the shoulders, not straight above the hips (else it floats behind the spine).
  return (
    <group>
      <mesh position={[0, 2.4, 0.38]} castShadow material={skin}><sphereGeometry args={[0.4, 32, 32]} /></mesh>
      <mesh position={[0, 2.54, 0.34]} rotation={[0.3, 0, 0]} castShadow material={hair}><sphereGeometry args={[0.43, 32, 32, 0, Math.PI*2, 0, Math.PI*0.55]} /></mesh>
      <mesh position={[0, 1.5, 0.1]} rotation={[0.3,0,0]} castShadow material={M.scrubs}><capsuleGeometry args={[0.5, 1.1, 12, 24]} /></mesh>
      <mesh position={[0,0.85,0.2]} castShadow material={M.scrubsDk}><sphereGeometry args={[0.5,24,24]} /></mesh>
      {/* kneeling legs folded */}
      <Limb from={[-0.3,0.7,0.3]} to={[-0.35,0.2,1.3]} radius={0.2} material={M.scrubsDk} />
      <Limb from={[0.3,0.7,0.3]} to={[0.35,0.2,1.3]} radius={0.2} material={M.scrubsDk} />
    </group>
  );
}

/* Rescuer arms reaching to a target point, with red "focus" hands. */
function RescuerArms({ target, M, groupRef }: { target:[number,number,number]; M: ReturnType<typeof useMaterials>; groupRef?: React.RefObject<THREE.Group | null>; }) {
  const [tx,ty,tz] = target;
  return (
    <group ref={groupRef}>
      <Limb from={[-0.45,1.9,0.3]} to={[tx-0.18, ty+0.1, tz]} radius={0.13} material={M.skinR} />
      <Limb from={[0.45,1.9,0.3]} to={[tx+0.18, ty+0.1, tz]} radius={0.13} material={M.skinR} />
      {/* stacked hands (focus) */}
      <mesh position={[tx,ty,tz]} castShadow material={M.focus}><sphereGeometry args={[0.26,20,20]} /></mesh>
      <mesh position={[tx,ty+0.18,tz]} castShadow material={M.focus}><sphereGeometry args={[0.22,20,20]} /></mesh>
    </group>
  );
}

/* Soft focus ring on the ground/target to direct the eye. */
function FocusRing({ position }: { position:[number,number,number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.getElapsedTime()*3)*0.12;
    ref.current.scale.set(s, s, s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.5 - Math.sin(clock.getElapsedTime()*3)*0.2;
  });
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI/2,0,0]}>
      <ringGeometry args={[0.34, 0.46, 32]} />
      <meshBasicMaterial color={FOCUS} transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ----------------------------- SCENES ----------------------------------- */

function CPRScene({ M }: { M: ReturnType<typeof useMaterials> }) {
  const arms = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!arms.current) return;
    arms.current.position.y = -Math.abs(Math.sin(clock.getElapsedTime()*Math.PI*2.0)) * 0.18;
  });
  return (
    <group position={[0,-0.4,0]}>
      <Human pose="supine" M={M} variant="patient" />
      {/* rescuer kneeling at patient's side */}
      <group position={[-1.7, 0, -0.4]} rotation={[0, Math.PI/2, 0]}>
        <Human pose="sit" M={M} variant="rescuer" />
        <RescuerArms target={[0,1.0,1.55]} M={M} groupRef={arms} />
      </group>
      <FocusRing position={[0, 0.96, -0.45]} />
    </group>
  );
}

function AirwayScene({ M }: { M: ReturnType<typeof useMaterials> }) {
  const head = useRef<THREE.Group>(null);   // the patient's actual head, tilts back
  const hands = useRef<THREE.Group>(null);  // rescuer's hands, lift the chin in sync
  useFrame(({ clock }) => {
    const t = Math.abs(Math.sin(clock.getElapsedTime() * 1.1));
    if (head.current) head.current.rotation.x = -t * 0.5;   // tilt the head back
    if (hands.current) hands.current.position.y = t * 0.15; // chin lift
  });
  return (
    <group position={[0,-0.4,0]}>
      {/* headRef lets us tilt the patient's real head (head-tilt, chin-lift) */}
      <Human pose="supine" M={M} variant="patient" headRef={head} />
      {/* rescuer hands at jaw/forehead */}
      <group position={[-1.4,0,-1.9]} rotation={[0,Math.PI/2,0]}>
        <Human pose="sit" M={M} variant="rescuer" />
        <RescuerArms target={[0,0.95,1.3]} M={M} groupRef={hands} />
      </group>
      <FocusRing position={[0, 0.95, -2.05]} />
    </group>
  );
}

function BleedingScene({ M }: { M: ReturnType<typeof useMaterials> }) {
  const arms = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!arms.current) return;
    arms.current.position.y = Math.abs(Math.sin(clock.getElapsedTime()*2.2))*0.06;
  });
  return (
    <group position={[0,-0.6,0]}>
      {/* a forearm laid across, patient skin */}
      <Limb from={[-2.6,1.2,0]} to={[2.4,1.0,0]} radius={0.42} material={M.skin} />
      <mesh position={[2.7,1.0,0]} castShadow material={M.skin}><sphereGeometry args={[0.5,24,24]} /></mesh>
      {/* dressing pad (clean white-blue, not gore) */}
      <mesh position={[0,1.45,0]} castShadow material={M.mat}><boxGeometry args={[1.1,0.18,1.1]} /></mesh>
      {/* rescuer pressing hands */}
      <group ref={arms}>
        <Limb from={[-0.9,3.2,0.6]} to={[-0.2,1.7,0.1]} radius={0.16} material={M.skinR} />
        <Limb from={[0.9,3.2,0.6]} to={[0.2,1.7,0.1]} radius={0.16} material={M.skinR} />
        <mesh position={[0,1.55,0]} castShadow material={M.focus}><sphereGeometry args={[0.34,20,20]} /></mesh>
      </group>
      <FocusRing position={[0,1.5,0]} />
    </group>
  );
}

function ChokingThrustsScene({ M }: { M: ReturnType<typeof useMaterials> }) {
  const arms = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!arms.current) return;
    const c = Math.abs(Math.sin(clock.getElapsedTime()*2.6));
    arms.current.position.z = -c*0.3;
    arms.current.position.y = c*0.2;
  });
  return (
    <group position={[0,-0.3,0]} scale={0.8}>
      {/* patient standing, front */}
      <group position={[0,0,0.5]}><Human pose="stand" M={M} variant="patient" /></group>
      {/* rescuer behind — hide default arms; the wrapping arms below replace them */}
      <group position={[0,0,-0.7]}><Human pose="stand" M={M} variant="rescuer" hideArms /></group>
      {/* rescuer arms wrapping around patient abdomen */}
      <group ref={arms} position={[0,0,0]}>
        <Limb from={[-0.8,2.5,-0.5]} to={[0,1.9,0.55]} radius={0.14} material={M.skinR} />
        <Limb from={[0.8,2.5,-0.5]} to={[0,1.9,0.55]} radius={0.14} material={M.skinR} />
        <mesh position={[0,1.9,0.7]} castShadow material={M.focus}><sphereGeometry args={[0.28,20,20]} /></mesh>
      </group>
      <FocusRing position={[0,1.9,0.9]} />
    </group>
  );
}

function ChokingBackScene({ M }: { M: ReturnType<typeof useMaterials> }) {
  const hand = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!hand.current) return;
    hand.current.rotation.x = -Math.abs(Math.sin(clock.getElapsedTime()*2.8))*0.9;
  });
  return (
    <group position={[0,-0.3,0]} scale={0.8}>
      {/* patient leaning forward */}
      <group position={[0,0,0.4]}><Human pose="lean" M={M} variant="patient" /></group>
      {/* rescuer at side — hide default arms; the striking arm below replaces them */}
      <group position={[1.4,0,-0.3]} rotation={[0,-Math.PI/3,0]}><Human pose="stand" M={M} variant="rescuer" hideArms /></group>
      {/* striking hand between shoulder blades */}
      <group ref={hand} position={[0,2.4,-0.2]}>
        <Limb from={[1.0,0.4,0.2]} to={[0.1,0.0,0.3]} radius={0.13} material={M.skinR} />
        <mesh position={[0,0,0.35]} castShadow material={M.focus}><boxGeometry args={[0.4,0.4,0.18]} /></mesh>
      </group>
      <FocusRing position={[0,2.4,0.15]} />
    </group>
  );
}

function BurnWaterScene({ M }: { M: ReturnType<typeof useMaterials> }) {
  const water = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!water.current) return;
    water.current.position.y = 2.0 + Math.sin(clock.getElapsedTime()*12)*0.04;
  });
  return (
    <group position={[0,-0.8,0]}>
      {/* hand/forearm under tap */}
      <Limb from={[-2.4,1.1,0]} to={[1.8,1.0,0]} radius={0.4} material={M.skin} />
      <mesh position={[2.1,1.0,0]} castShadow material={M.skin}><sphereGeometry args={[0.48,24,24]} /></mesh>
      {/* faucet */}
      <mesh position={[-1.6,3.4,0]} castShadow material={M.mat}><boxGeometry args={[0.5,1.2,0.5]} /></mesh>
      <mesh position={[-0.7,3.7,0]} castShadow material={M.mat}><boxGeometry args={[2,0.35,0.35]} /></mesh>
      {/* cool blue water stream */}
      <mesh ref={water} position={[0.3,2.0,0]}>
        <cylinderGeometry args={[0.14,0.14,3,16]} />
        <meshStandardMaterial color="#38BDF8" transparent opacity={0.55} roughness={0.1} />
      </mesh>
      <FocusRing position={[0.3,1.45,0]} />
    </group>
  );
}

function ElevateScene({ M }: { M: ReturnType<typeof useMaterials> }) {
  const leg = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!leg.current) return;
    leg.current.rotation.x = -0.3 - Math.abs(Math.sin(clock.getElapsedTime()*1.6))*0.4;
  });
  return (
    <group position={[0,-0.5,0]}>
      <Human pose="supine" M={M} variant="patient" />
      {/* one leg raised on a support cushion */}
      <mesh position={[0.28,0.9,2.2]} castShadow material={M.mat}><boxGeometry args={[0.8,0.9,0.8]} /></mesh>
      <group ref={leg} position={[0.28,0.45,0.7]}>
        <FocusRing position={[0,0.6,1.4]} />
      </group>
    </group>
  );
}

/* Neutral scene for non-specific steps (assessment, "attend to the casualty").
   Deliberately NOT CPR — the old default showed chest compressions on choking,
   poisoning and burn steps, which is misleading. A single calm patient reads as
   "the person you're helping" and fits any step. */
function RestingScene({ M }: { M: ReturnType<typeof useMaterials> }) {
  return (
    <group position={[0, -0.4, 0]} rotation={[0, -0.4, 0]}>
      <Human pose="supine" M={M} variant="patient" />
      <FocusRing position={[0, 1.0, -0.7]} />
    </group>
  );
}

/* --------------------------- CAMERA RIG --------------------------------- */
function CameraRig({ view }: { view: string }) {
  useFrame((state) => {
    const t = 0.06;
    if (view === "top") state.camera.position.lerp(new THREE.Vector3(0, 8.5, 0.2), t);
    else if (view === "side") state.camera.position.lerp(new THREE.Vector3(8.5, 2.2, 0.2), t);
    else state.camera.position.lerp(new THREE.Vector3(5.4, 4.2, 5.4), t);
    state.camera.lookAt(0, 0.7, 0);
  });
  return null;
}

function Scene({ hint }: { hint: string }) {
  const M = useMaterials();
  switch (hint) {
    case "cpr_chest": return <CPRScene M={M} />;
    case "cpr_airway": return <AirwayScene M={M} />;
    case "compress":
    case "pressure_point":
    case "tourniquet":
    case "gloves":
    case "burn_cover": return <BleedingScene M={M} />;
    case "choking_thrusts": return <ChokingThrustsScene M={M} />;
    case "choking_back": return <ChokingBackScene M={M} />;
    case "burn_water": return <BurnWaterScene M={M} />;
    case "elevate": return <ElevateScene M={M} />;
    default: return <RestingScene M={M} />;
  }
}

export default function VisualOverlay({ hint }: VisualOverlayProps) {
  const [view, setView] = useState("isometric");

  const getLabel = () => {
    switch (hint) {
      case "cpr_chest": return "Chest Compressions (100\u2013120 bpm)";
      case "cpr_airway": return "Open Airway (Head Tilt, Chin Lift)";
      case "compress": return "Apply Direct Pressure";
      case "choking_thrusts": return "Abdominal Thrusts";
      case "choking_back": return "Back Blows";
      case "burn_water": return "Cool Burn Under Running Water";
      case "elevate": return "Elevate the Limb";
      case "tourniquet": return "Apply Tourniquet Above Wound";
      default: return "Follow Active Rescue Protocol";
    }
  };

  const btn = (id:string, Icon:any, label:string) => (
    <button
      onClick={() => setView(id)}
      className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
        view === id ? "bg-teal-600 text-white shadow-md" : "bg-white/90 text-slate-600 hover:bg-white shadow-sm border border-slate-200"
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  const webglOK = useMemo(() => isWebGLAvailable(), []);

  // Shown when WebGL can't render the 3D scene — keeps the guide useful and calm
  // instead of leaving a blank panel during an emergency.
  const fallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-16 h-16 rounded-2xl bg-teal-600/10 border border-teal-200 flex items-center justify-center text-teal-600">
        <Activity className="w-8 h-8" />
      </div>
      <div className="text-slate-900 font-extrabold text-sm uppercase tracking-wide font-display">
        {getLabel()}
      </div>
      <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
        Interactive 3D guide isn't available on this device. Follow the written
        steps and voice guidance below — they contain the full procedure.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col w-full mx-auto space-y-4">
      <div className="relative w-full h-72 md:h-80 bg-gradient-to-b from-slate-50 to-slate-100 rounded-[2rem] border-2 border-slate-200 shadow-inner overflow-hidden group">
        {webglOK && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {btn("top", Eye, "Top")}
            {btn("side", Camera, "Side")}
            {btn("isometric", BoxSelect, "Iso")}
          </div>
        )}
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-lg border border-slate-800">
          3D Guide
        </div>

        {webglOK ? (
        <CanvasErrorBoundary fallback={fallback}>
        <Canvas shadows camera={{ position: [5.4, 4.2, 5.4], fov: 45 }}>
          <CameraRig view={view} />
          <ambientLight intensity={0.7} />
          <hemisphereLight args={["#ffffff", "#bcd0d6", 0.6]} />
          <directionalLight position={[6, 10, 4]} intensity={1.4} castShadow shadow-mapSize={[2048, 2048]}>
            <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 0.1, 30]} />
          </directionalLight>
          <directionalLight position={[-5, 4, -3]} intensity={0.4} color="#cfe7ff" />
          <Environment preset="apartment" />

          {/* soft floor to catch shadows */}
          <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.0,0]} receiveShadow>
            <planeGeometry args={[40,40]} />
            <meshStandardMaterial color={FLOOR} roughness={1} />
          </mesh>

          <Scene hint={hint} />

          <ContactShadows position={[0,-0.99,0]} opacity={0.35} scale={24} blur={2.6} far={5} />
        </Canvas>
        </CanvasErrorBoundary>
        ) : (
          fallback
        )}
      </div>

      <div className="text-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <h4 className="text-slate-900 font-extrabold text-sm uppercase tracking-wide font-display mb-1">
          {getLabel()}
        </h4>
        <p className="text-slate-500 text-xs font-medium">
          {webglOK ? (
            <>
              Stylized 3D guide. Use the camera buttons to change angle. The <span className="text-red-500 font-bold">red highlight</span> marks where the rescuer applies focus.
            </>
          ) : (
            <>Follow the written steps and voice guidance for the complete procedure.</>
          )}
        </p>
      </div>
    </div>
  );
}
