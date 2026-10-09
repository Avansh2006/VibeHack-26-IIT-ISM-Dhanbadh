import { useLayoutEffect, useRef } from 'react';
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Float, RoundedBox, Sparkles } from '@react-three/drei';
import { gsap } from 'gsap';
import * as THREE from 'three';
import type { Group, Mesh } from 'three';
import type { CourtroomSpeaker } from '@/audio';
import type { DefenseId } from '@/components/courtroom/trialLogic';
import type { InteractionRecord } from '@/shared/contracts';

export type PunishmentType = 'mud' | 'spinner' | 'apology';

export type TrialPhase =
  | 'summons'
  | 'evidence'
  | 'defense'
  | 'objection'
  | 'verdict'
  | 'roulette'
  | 'mud'
  | 'spinner'
  | 'apology'
  | 'appeal'
  | 'certificate';

export interface CourtroomScene3DProps {
  phase: TrialPhase;
  speaker: CourtroomSpeaker | null;
  exhibits: readonly InteractionRecord[];
  selectedDefense: DefenseId | null;
  selectedPunishment?: PunishmentType | null | undefined;
  rouletteSpinning?: boolean | undefined;
  rouletteAngle?: number | undefined;
  mudScore?: number | undefined;
  spinnerProgress?: number | undefined;
  reducedMotion: boolean;
  gavelPulse: number;
  onGavel(this: void): void;
  onSpinDrag?: ((delta: number) => void) | undefined;
}

// Warm, cinematic courtroom palette
const WOOD_MAHOGANY = '#542616';
const WOOD_TRIM = '#7d3f22';
const WOOD_LIGHT = '#a6623b';
const BRASS_GOLD = '#f2be42';
const PLASTER_WALL = '#baa188';
const WAINSCOT_WALL = '#3d1f14';
const CARPET_RED = '#851a26';

export default function CourtroomScene3D(props: CourtroomScene3DProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 3.2, 9.8], fov: 46, near: 0.1, far: 90 }}
      shadows
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.28,
      }}
      fallback={<div className="court-webgl-fallback" aria-hidden="true" />}
    >
      <color attach="background" args={['#181216']} />
      <fog attach="fog" args={['#181216', 26, 68]} />

      {/* Cinematic Courtroom Lighting Cluster */}
      {/* 1. Ambient & Hemisphere Courtroom Fill */}
      <ambientLight intensity={0.92} color="#fff1db" />
      <hemisphereLight args={['#fff4e0', '#3b2518', 0.98]} />

      {/* 2. Key Courtroom Skylight / Directional */}
      <directionalLight
        castShadow
        position={[6, 15, 8]}
        intensity={2.3}
        color="#fff9ec"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <pointLight position={[0, 4.6, 3.2]} intensity={26} color="#ffe1b3" distance={18} />

      {/* 3. Spotlights on Judge, Prosecution & Defense Podiums */}
      <spotLight
        castShadow
        position={[0, 11, -0.5]}
        target-position={[0, 2.8, -5]}
        angle={0.65}
        penumbra={0.7}
        intensity={60}
        color="#ffe2a8"
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight
        position={[-6, 9, 2.5]}
        target-position={[-5.8, 1.8, -0.8]}
        intensity={36}
        angle={0.55}
        penumbra={0.6}
        color="#ffd4aa"
      />
      <spotLight
        position={[4.5, 9, 3]}
        target-position={[3.2, 1.8, 1.8]}
        intensity={40}
        angle={0.58}
        penumbra={0.6}
        color="#d8eeff"
      />

      {/* 4. Character Rim Lights */}
      {/* Judge rim */}
      <pointLight position={[0, 5.2, -6.8]} intensity={22} color="#ffe4ac" distance={9} />
      {/* Prosecutor rim */}
      <pointLight position={[-7.2, 3.8, -1.8]} intensity={16} color="#ff8e7b" distance={8} />
      {/* Defense & Defendant rim */}
      <pointLight position={[5.4, 3.8, 1.6]} intensity={18} color="#7dd5ff" distance={8} />
      {/* Clerk rim */}
      <pointLight position={[1.8, 2.8, -3.2]} intensity={14} color="#ffd4a0" distance={7} />

      {/* Architecture & Furniture */}
      <CourtroomArchitecture />
      <CourtroomDoors phase={props.phase} reducedMotion={props.reducedMotion} />
      <CourtroomChandeliers />

      {/* Characters */}
      <JudgeCharacter
        phase={props.phase}
        speaker={props.speaker}
        selectedDefense={props.selectedDefense}
        reducedMotion={props.reducedMotion}
      />
      <ProsecutorCharacter phase={props.phase} speaker={props.speaker} />
      <DefenseLawyerCharacter speaker={props.speaker} reducedMotion={props.reducedMotion} />
      <ClerkCharacter speaker={props.speaker} />
      <DefendantCharacter
        phase={props.phase}
        speaker={props.speaker}
        spinnerProgress={props.spinnerProgress ?? 0}
        reducedMotion={props.reducedMotion}
      />

      {/* Evidence Holograms */}
      <EvidenceTable exhibits={props.exhibits} phase={props.phase} />

      {/* Interactive Gavel */}
      <InteractiveGavel
        phase={props.phase}
        pulse={props.gavelPulse}
        reducedMotion={props.reducedMotion}
        onGavel={props.onGavel}
      />

      {/* 3D Punishment Props */}
      <RouletteWheel3D
        phase={props.phase}
        angle={props.rouletteAngle ?? 0}
        spinning={Boolean(props.rouletteSpinning)}
      />
      <MudPuddleAndSplash
        active={props.phase === 'mud'}
        score={props.mudScore ?? 2.4}
        reducedMotion={props.reducedMotion}
      />
      <HumanLoadingSpinner3D
        active={props.phase === 'spinner'}
        progress={props.spinnerProgress ?? 0}
        onDragDelta={props.onSpinDrag}
      />
      <ApologyPodium active={props.phase === 'apology'} />

      {/* Appeal Confetti & Sparkles */}
      {props.phase === 'appeal' ? (
        <AppealConfetti reducedMotion={props.reducedMotion} />
      ) : props.phase === 'verdict' ? (
        <Sparkles count={60} scale={[14, 8, 12]} size={2.4} speed={0.4} color="#ffd978" />
      ) : null}

      {/* Camera Director */}
      <CameraDirector
        phase={props.phase}
        speaker={props.speaker}
        reducedMotion={props.reducedMotion}
      />

      {/* Soft Contact Shadows & Environment Reflection */}
      <ContactShadows position={[0, 0.02, 0]} opacity={0.62} scale={28} blur={2.2} far={8} />
      <Environment preset="apartment" environmentIntensity={0.62} />
    </Canvas>
  );
}

/* =========================================================================
   1. Courtroom Architecture & Warm Lighting Fixtures
   ========================================================================= */

function CourtroomArchitecture() {
  return (
    <group>
      {/* Rich Polished Hardwood Parquet Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[34, 42]} />
        <meshStandardMaterial color="#4e2818" roughness={0.34} metalness={0.12} />
      </mesh>

      {/* Wooden floor plank stripes for depth */}
      {Array.from({ length: 15 }, (_, index) => (
        <mesh
          key={index}
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.008, index * 1.5 - 9]}
        >
          <planeGeometry args={[26, 0.04]} />
          <meshStandardMaterial color={index % 2 ? '#8f4f2c' : '#3d1d11'} roughness={0.45} />
        </mesh>
      ))}

      {/* Center Courtroom Runner Carpet */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 1]}>
        <planeGeometry args={[3.8, 18]} />
        <meshStandardMaterial color={CARPET_RED} roughness={0.88} />
      </mesh>
      {/* Gold Carpet Borders */}
      {[-1.9, 1.9].map((x) => (
        <mesh key={x} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.014, 1]}>
          <planeGeometry args={[0.08, 18]} />
          <meshStandardMaterial color={BRASS_GOLD} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Back Wall - Two Tone Wainscot + Plaster */}
      <group position={[0, 0, -8.6]}>
        {/* Lower Mahogany Wainscot */}
        <mesh receiveShadow position={[0, 2.4, 0]}>
          <boxGeometry args={[26, 4.8, 0.5]} />
          <meshStandardMaterial color={WAINSCOT_WALL} roughness={0.5} />
        </mesh>
        {/* Wainscot Upper Brass Molding */}
        <mesh castShadow position={[0, 4.85, 0.28]}>
          <boxGeometry args={[26.2, 0.16, 0.2]} />
          <meshStandardMaterial color={BRASS_GOLD} metalness={0.75} roughness={0.25} />
        </mesh>
        {/* Upper Courtroom Stately Plaster */}
        <mesh receiveShadow position={[0, 7.6, 0]}>
          <boxGeometry args={[26, 5.6, 0.5]} />
          <meshStandardMaterial color={PLASTER_WALL} roughness={0.88} />
        </mesh>
      </group>

      {/* Left Wall */}
      <group position={[-13, 0, 1]}>
        <mesh receiveShadow position={[0, 2.4, 0]}>
          <boxGeometry args={[0.5, 4.8, 22]} />
          <meshStandardMaterial color={WAINSCOT_WALL} roughness={0.5} />
        </mesh>
        <mesh receiveShadow position={[0, 7.6, 0]}>
          <boxGeometry args={[0.5, 5.6, 22]} />
          <meshStandardMaterial color={PLASTER_WALL} roughness={0.88} />
        </mesh>
        {/* Wall Sconces */}
        {[-4, 2, 8].map((z) => (
          <WallSconce key={z} position={[0.35, 5.2, z]} rotation={[0, 0, 0]} />
        ))}
      </group>

      {/* Right Wall */}
      <group position={[13, 0, 1]}>
        <mesh receiveShadow position={[0, 2.4, 0]}>
          <boxGeometry args={[0.5, 4.8, 22]} />
          <meshStandardMaterial color={WAINSCOT_WALL} roughness={0.5} />
        </mesh>
        <mesh receiveShadow position={[0, 7.6, 0]}>
          <boxGeometry args={[0.5, 5.6, 22]} />
          <meshStandardMaterial color={PLASTER_WALL} roughness={0.88} />
        </mesh>
        {/* Wall Sconces */}
        {[-4, 2, 8].map((z) => (
          <WallSconce key={z} position={[-0.35, 5.2, z]} rotation={[0, Math.PI, 0]} />
        ))}
      </group>

      {/* Grand Courtroom Pillars with Brass Trim */}
      {[-8.5, 8.5].map((x) => (
        <group key={x} position={[x, 0, -8.0]}>
          <mesh castShadow receiveShadow position={[0, 4.2, 0.4]}>
            <cylinderGeometry args={[0.55, 0.68, 8.4, 16]} />
            <meshStandardMaterial color="#664c39" roughness={0.55} />
          </mesh>
          <mesh castShadow position={[0, 8.4, 0.4]}>
            <boxGeometry args={[1.6, 0.5, 1.2]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.78} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Elevated Judge's Grand Bench */}
      <group position={[0, 0, -5.5]}>
        {/* Raised Podium Dais */}
        <mesh receiveShadow position={[0, 0.25, 0]}>
          <boxGeometry args={[8.8, 0.5, 3.2]} />
          <meshStandardMaterial color={WOOD_MAHOGANY} roughness={0.4} />
        </mesh>
        {/* Grand Mahogany Desk with Brass Molding */}
        <Bench position={[0, 1.45, 0]} scale={[8.2, 2.1, 1.7]} />
        {/* Bench Brass Inlay Panels */}
        {[-2.4, 0, 2.4].map((x) => (
          <mesh key={x} position={[x, 1.35, 0.88]}>
            <boxGeometry args={[1.6, 1.2, 0.05]} />
            <meshStandardMaterial color={WOOD_TRIM} roughness={0.35} />
          </mesh>
        ))}
      </group>

      {/* Court Clerk's Desk (Directly below Judge Bench) */}
      <group position={[0, 0, -3.4]}>
        <Bench position={[0, 0.65, 0]} scale={[4.2, 1.2, 1.3]} />
      </group>

      {/* Prosecution Podium & Table (Left) */}
      <group position={[-5.8, 0, -1.0]}>
        <Bench position={[0, 0.72, 0]} scale={[3.4, 1.4, 1.9]} />
        {/* Prosecution Briefcase */}
        <mesh castShadow position={[-0.4, 1.55, 0]}>
          <boxGeometry args={[0.9, 0.24, 0.6]} />
          <meshStandardMaterial color="#22110c" roughness={0.3} />
        </mesh>
      </group>

      {/* Defense Table & Stand (Right) */}
      <group position={[3.8, 0, 1.6]}>
        <Bench position={[0, 0.68, 0]} scale={[4.2, 1.32, 1.8]} />
      </group>

      {/* Witness Stand & Jury Box */}
      <WitnessStand />
      <JuryBox />
      <CourtSeal />
    </group>
  );
}

function WallSconce({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[0.1, 0.35, 0.18]} />
        <meshStandardMaterial color={BRASS_GOLD} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Glowing Lantern Shade */}
      <mesh position={[0.16, 0.15, 0]}>
        <sphereGeometry args={[0.14, 12, 10]} />
        <meshStandardMaterial
          color="#ffebaa"
          emissive="#ffa834"
          emissiveIntensity={2.5}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

function CourtroomChandeliers() {
  return (
    <group>
      {[-3, 3].map((z) => (
        <group key={z} position={[0, 8.8, z]}>
          {/* Chandelier Stem */}
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Brass Ring */}
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.3, 0.08, 10, 28]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Glowing Frosted Glass Bowl */}
          <mesh position={[0, -0.22, 0]}>
            <sphereGeometry args={[0.72, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial
              color="#fff8db"
              emissive="#ffbe55"
              emissiveIntensity={2.0}
              roughness={0.25}
            />
          </mesh>
          {/* Chandelier Light Source */}
          <pointLight position={[0, -0.5, 0]} intensity={18} color="#ffe5b2" distance={12} />
        </group>
      ))}
    </group>
  );
}

function Bench({
  position,
  scale,
}: {
  position: [number, number, number];
  scale: [number, number, number];
}) {
  return (
    <RoundedBox
      castShadow
      receiveShadow
      position={position}
      args={scale}
      radius={0.08}
      smoothness={3}
    >
      <meshStandardMaterial color={WOOD_MAHOGANY} roughness={0.38} metalness={0.12} />
    </RoundedBox>
  );
}

function CourtSeal() {
  return (
    <group position={[0, 5.6, -8.28]}>
      <mesh castShadow>
        <cylinderGeometry args={[1.32, 1.32, 0.18, 48]} />
        <meshStandardMaterial color={BRASS_GOLD} metalness={0.82} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <torusGeometry args={[0.88, 0.12, 12, 44]} />
        <meshStandardMaterial color="#3b1c10" metalness={0.4} />
      </mesh>
      {/* Scales of Justice Icon Silhouette */}
      <mesh position={[0, 0, 0.15]}>
        <boxGeometry args={[0.1, 0.85, 0.06]} />
        <meshStandardMaterial color="#241008" />
      </mesh>
      <mesh position={[0, 0.32, 0.15]}>
        <boxGeometry args={[0.8, 0.08, 0.06]} />
        <meshStandardMaterial color="#241008" />
      </mesh>
    </group>
  );
}

function CourtroomDoors({ phase, reducedMotion }: { phase: TrialPhase; reducedMotion: boolean }) {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);

  useLayoutEffect(() => {
    if (!left.current || !right.current) return;
    const context = gsap.context(() => {
      const duration = reducedMotion ? 0 : 2.2;
      gsap.to(left.current!.rotation, {
        y: -Math.PI * 0.65,
        duration,
        delay: reducedMotion ? 0 : 0.2,
        ease: 'power3.inOut',
      });
      gsap.to(right.current!.rotation, {
        y: Math.PI * 0.65,
        duration,
        delay: reducedMotion ? 0 : 0.2,
        ease: 'power3.inOut',
      });
    });
    return () => context.revert();
  }, [phase, reducedMotion]);

  if (phase !== 'summons') return null;

  return (
    <group position={[0, 0, 8.8]}>
      {/* Left Door - Hinged at x = -4.4 */}
      <group ref={left} position={[-4.4, 0, 0]}>
        <mesh castShadow position={[2.2, 3.0, 0]}>
          <boxGeometry args={[4.4, 6.0, 0.28]} />
          <meshStandardMaterial color="#3d1d11" roughness={0.36} />
        </mesh>
        {/* Brass Door Handle */}
        <mesh position={[4.0, 2.9, 0.22]}>
          <cylinderGeometry args={[0.06, 0.06, 0.48, 12]} />
          <meshStandardMaterial color={BRASS_GOLD} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      {/* Right Door - Hinged at x = 4.4 */}
      <group ref={right} position={[4.4, 0, 0]}>
        <mesh castShadow position={[-2.2, 3.0, 0]}>
          <boxGeometry args={[4.4, 6.0, 0.28]} />
          <meshStandardMaterial color="#3d1d11" roughness={0.36} />
        </mesh>
        {/* Brass Door Handle */}
        <mesh position={[-4.0, 2.9, 0.22]}>
          <cylinderGeometry args={[0.06, 0.06, 0.48, 12]} />
          <meshStandardMaterial color={BRASS_GOLD} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

function WitnessStand() {
  return (
    <group position={[7.2, 0, -2.4]}>
      <Bench position={[0, 0.85, 0]} scale={[3.2, 1.7, 2.4]} />
      <mesh castShadow position={[0, 1.88, -0.75]}>
        <boxGeometry args={[3.3, 0.18, 0.18]} />
        <meshStandardMaterial color={BRASS_GOLD} metalness={0.75} roughness={0.25} />
      </mesh>
    </group>
  );
}

function JuryBox() {
  return (
    <group position={[8.4, 0, 1.2]}>
      {Array.from({ length: 6 }, (_, index) => (
        <group key={index} position={[(index % 2) * 1.35, 0, Math.floor(index / 2) * 1.4]}>
          <mesh castShadow position={[0, 0.65, 0]}>
            <boxGeometry args={[1.05, 0.18, 1]} />
            <meshStandardMaterial color={CARPET_RED} roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, 1.2, 0.42]}>
            <boxGeometry args={[1.05, 1.05, 0.16]} />
            <meshStandardMaterial color={CARPET_RED} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* =========================================================================
   2. Characters (Judge, Prosecutor, Defense Lawyer, Clerk, Defendant)
   ========================================================================= */

function JudgeCharacter({
  phase,
  speaker,
  selectedDefense,
  reducedMotion,
}: {
  phase: TrialPhase;
  speaker: CourtroomSpeaker | null;
  selectedDefense: DefenseId | null;
  reducedMotion: boolean;
}) {
  const character = useRef<Group>(null);
  const head = useRef<Group>(null);
  const arm = useRef<Group>(null);
  const wig = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const time = clock.getElapsedTime();
    const isSpeaking = speaker === 'judge' || phase === 'verdict' || phase === 'appeal';

    if (head.current) {
      head.current.rotation.z =
        Math.sin(time * (isSpeaking ? 8 : 1.6)) * (isSpeaking ? 0.045 : 0.012);
      head.current.rotation.y =
        selectedDefense === 'mouse' ? -0.22 : selectedDefense === 'javascript' ? 0.22 : 0;
      head.current.position.y = 2.75 + Math.sin(time * 2.5) * 0.028;
    }
    if (wig.current) {
      wig.current.rotation.z =
        phase === 'appeal' ? Math.sin(time * 16) * 0.09 : Math.sin(time * 1.2) * 0.008;
      wig.current.position.y = phase === 'appeal' ? Math.abs(Math.sin(time * 12)) * 0.06 : 0;
    }
    if (arm.current) {
      const pounding = phase === 'appeal' || phase === 'objection';
      arm.current.rotation.x = pounding
        ? Math.sin(time * 14) * 0.4 - 0.9
        : isSpeaking
          ? Math.sin(time * 6) * 0.15 - 0.3
          : 0;
    }
  });

  useLayoutEffect(() => {
    if (!character.current) return;
    const context = gsap.context(() => {
      if (phase === 'appeal' || phase === 'verdict' || phase === 'objection') {
        gsap.fromTo(
          character.current!.scale,
          { x: 1.2, y: 0.82, z: 1.2 },
          { x: 1, y: 1, z: 1, duration: 0.6, ease: 'elastic.out(1.2, 0.35)' },
        );
      }
    });
    return () => context.revert();
  }, [phase]);

  return (
    <group ref={character} position={[0, 2.5, -5.1]}>
      {/* Black Judicial Robe with White Jabot */}
      <mesh castShadow position={[0, 1.3, 0]}>
        <capsuleGeometry args={[0.76, 1.65, 8, 16]} />
        <meshStandardMaterial color="#141418" roughness={0.65} />
      </mesh>
      {/* White lace collar jabot */}
      <mesh position={[0, 2.05, 0.65]}>
        <boxGeometry args={[0.42, 0.55, 0.08]} />
        <meshStandardMaterial color="#f7f5f0" roughness={0.8} />
      </mesh>

      {/* Head & Grand Curly Powdered Wig */}
      <group ref={head} position={[0, 2.75, 0]}>
        {/* Face */}
        <mesh castShadow>
          <sphereGeometry args={[0.74, 24, 18]} />
          <meshStandardMaterial color="#d49a75" roughness={0.72} />
        </mesh>

        {/* Big Curly Powdered Wig */}
        <group ref={wig}>
          {/* Main top wig dome */}
          <mesh position={[0, 0.32, -0.06]} scale={[1.18, 0.62, 1.15]}>
            <sphereGeometry args={[0.72, 20, 16]} />
            <meshStandardMaterial color="#f0eee8" roughness={0.95} />
          </mesh>
          {/* Side wig roll coils */}
          {[-0.68, 0.68].map((x) => (
            <mesh key={x} position={[x, 0.1, -0.05]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.26, 0.26, 0.85, 12]} />
              <meshStandardMaterial color="#f0eee8" roughness={0.95} />
            </mesh>
          ))}
        </group>

        {/* Spectacles / Half-moon Glasses */}
        <mesh position={[0, 0.12, 0.72]}>
          <boxGeometry args={[0.55, 0.12, 0.04]} />
          <meshStandardMaterial color={BRASS_GOLD} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Expressive Eyebrows & Eyes */}
        {[-0.26, 0.26].map((x) => (
          <group key={x} position={[x, 0.12, 0.68]}>
            <mesh scale={[1, phase === 'appeal' ? 0.4 : 1, 1]}>
              <sphereGeometry args={[0.075, 12, 8]} />
              <meshStandardMaterial color="#100d0a" />
            </mesh>
            <mesh
              position={[0, 0.14, 0.02]}
              rotation={[0, 0, phase === 'appeal' ? (x < 0 ? 0.38 : -0.38) : x < 0 ? -0.18 : 0.18]}
            >
              <boxGeometry args={[0.28, 0.05, 0.05]} />
              <meshStandardMaterial color="#54443b" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Animated Gavel Arm */}
      <group ref={arm} position={[0.95, 1.55, 0.2]} rotation={[0, 0, -0.45]}>
        <mesh castShadow position={[0, -0.55, 0]}>
          <capsuleGeometry args={[0.18, 0.95, 6, 10]} />
          <meshStandardMaterial color="#141418" />
        </mesh>
      </group>
    </group>
  );
}

function ProsecutorCharacter({
  phase,
  speaker,
}: {
  phase: TrialPhase;
  speaker: CourtroomSpeaker | null;
}) {
  const group = useRef<Group>(null);
  const arm = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const time = clock.getElapsedTime();
    const active = speaker === 'prosecutor' || phase === 'objection';
    group.current.rotation.z = active ? Math.sin(time * 9) * 0.03 : 0;
    if (arm.current) {
      // Dramatic objection point towards defense
      arm.current.rotation.z = active ? -1.1 + Math.sin(time * 8) * 0.12 : -0.2;
    }
  });

  return (
    <group ref={group} position={[-5.8, 0, -0.7]}>
      {/* Sleek Crimson Tailored Suit */}
      <mesh castShadow position={[0, 1.55, 0]}>
        <capsuleGeometry args={[0.5, 1.5, 6, 12]} />
        <meshStandardMaterial color="#6e1424" roughness={0.45} />
      </mesh>
      {/* Head with sleek haircut */}
      <mesh castShadow position={[0, 2.85, 0]}>
        <sphereGeometry args={[0.52, 18, 14]} />
        <meshStandardMaterial color="#d49572" roughness={0.7} />
      </mesh>
      {/* Stylish Glasses */}
      <mesh position={[0, 2.92, 0.49]}>
        <boxGeometry args={[0.48, 0.12, 0.06]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
      </mesh>
      {/* Dramatic Pointing Arm */}
      <group ref={arm} position={[0.52, 2.1, 0]}>
        <mesh castShadow position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <capsuleGeometry args={[0.13, 0.9, 6, 8]} />
          <meshStandardMaterial color="#6e1424" roughness={0.45} />
        </mesh>
      </group>
      {/* Gold tie clip / badge */}
      <mesh position={[0, 1.9, 0.48]}>
        <boxGeometry args={[0.18, 0.28, 0.06]} />
        <meshStandardMaterial color={BRASS_GOLD} metalness={0.8} />
      </mesh>
    </group>
  );
}

function DefenseLawyerCharacter({
  speaker,
  reducedMotion,
}: {
  speaker: CourtroomSpeaker | null;
  reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  const papers = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (reducedMotion || !group.current) return;
    const time = clock.getElapsedTime();
    const active = speaker === 'defense' || speaker === 'assistant';
    // Nervous trembling
    const tremble = Math.sin(time * 26) * 0.018;
    group.current.position.x = 2.9 + tremble;
    if (papers.current) {
      papers.current.rotation.z = Math.sin(time * 18) * 0.06;
    }
    group.current.position.y = active ? Math.abs(Math.sin(time * 10)) * 0.05 : 0;
  });

  return (
    <group ref={group} position={[2.9, 0, 2.6]}>
      {/* Rumpled Slate-Blue Suit */}
      <mesh castShadow position={[0, 1.48, 0]}>
        <capsuleGeometry args={[0.48, 1.45, 6, 12]} />
        <meshStandardMaterial color="#213d5b" roughness={0.7} />
      </mesh>
      {/* Sweating Head */}
      <mesh castShadow position={[0, 2.76, 0]}>
        <sphereGeometry args={[0.5, 18, 14]} />
        <meshStandardMaterial color="#d99f7a" roughness={0.8} />
      </mesh>
      {/* Crooked Glasses */}
      <mesh position={[0, 2.82, 0.47]} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[0.46, 0.1, 0.04]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      {/* Trembling stack of legal papers */}
      <group ref={papers} position={[0, 1.5, 0.52]}>
        <mesh castShadow rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.5, 0.1, 0.4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function ClerkCharacter({ speaker }: { speaker: CourtroomSpeaker | null }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const active = speaker === 'clerk';
    // Deadpan slow head tilt
    group.current.rotation.y = active ? Math.sin(clock.getElapsedTime() * 2) * 0.1 : 0;
  });

  return (
    <group ref={group} position={[0, 0.8, -3.2]}>
      {/* Sitting Clerk */}
      <mesh castShadow position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.42, 0.9, 6, 10]} />
        <meshStandardMaterial color="#2c3944" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.42, 16, 12]} />
        <meshStandardMaterial color="#cb9272" roughness={0.75} />
      </mesh>
      {/* 404 Coffee Mug on Desk */}
      <mesh castShadow position={[0.9, 0.82, 0.35]}>
        <cylinderGeometry args={[0.12, 0.1, 0.24, 12]} />
        <meshStandardMaterial color="#e5e5e5" roughness={0.3} />
      </mesh>
      {/* Big Stamp */}
      <mesh castShadow position={[-0.8, 0.82, 0.35]}>
        <cylinderGeometry args={[0.08, 0.14, 0.22, 10]} />
        <meshStandardMaterial color={CARPET_RED} roughness={0.4} />
      </mesh>
    </group>
  );
}

function DefendantCharacter({
  phase,
  speaker,
  reducedMotion,
}: {
  phase: TrialPhase;
  speaker: CourtroomSpeaker | null;
  spinnerProgress: number;
  reducedMotion: boolean;
}) {
  const avatar = useRef<Group>(null);
  const head = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);

  // Animate mud acrobatic front roll
  useLayoutEffect(() => {
    if (!avatar.current) return;
    const context = gsap.context(() => {
      if (phase === 'mud') {
        const tl = gsap.timeline();
        if (reducedMotion) {
          tl.to(avatar.current!.position, { x: 0, y: 0.18, z: 0.5, duration: 0.1 });
          tl.to(avatar.current!.rotation, { x: Math.PI / 2, duration: 0.1 });
        } else {
          // Wind up & run
          tl.to(avatar.current!.position, {
            x: 1.2,
            y: 0.4,
            z: 1.2,
            duration: 0.35,
            ease: 'power2.in',
          });
          // High front roll flip into mud puddle
          tl.to(avatar.current!.position, {
            x: 0,
            y: 1.8,
            z: 0.5,
            duration: 0.45,
            ease: 'power1.out',
          });
          tl.to(
            avatar.current!.rotation,
            { x: Math.PI * 2 + Math.PI / 2, duration: 0.75, ease: 'power2.inOut' },
            '<',
          );
          // Splash landing on belly!
          tl.to(avatar.current!.position, { y: 0.15, duration: 0.3, ease: 'bounce.out' });
          tl.to(avatar.current!.scale, {
            x: 1.35,
            y: 0.65,
            z: 1.35,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
          });
        }
      } else if (phase === 'spinner') {
        // Positioned inside the loading spinner
        gsap.to(avatar.current!.position, { x: 0, y: 1.3, z: 0.5, duration: 0.5 });
        gsap.to(avatar.current!.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
      } else if (phase === 'apology') {
        // Standing at the apology podium
        gsap.to(avatar.current!.position, { x: 0, y: 0, z: 0.8, duration: 0.5 });
        gsap.to(avatar.current!.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
      } else {
        // Default: standing in the defense box
        gsap.to(avatar.current!.position, { x: 4.8, y: 0, z: 2.2, duration: 0.5 });
        gsap.to(avatar.current!.rotation, { x: 0, y: -0.35, z: 0, duration: 0.5 });
      }
    });
    return () => context.revert();
  }, [phase, reducedMotion]);

  useFrame(({ clock }) => {
    if (reducedMotion || !avatar.current) return;
    const time = clock.getElapsedTime();
    const protesting = speaker === 'defendant';
    if (leftArm.current && rightArm.current) {
      leftArm.current.rotation.z = protesting ? 1.4 + Math.sin(time * 10) * 0.16 : 0.32;
      rightArm.current.rotation.z = protesting ? -1.4 - Math.sin(time * 10) * 0.16 : -0.32;
    }
    if (phase === 'spinner') {
      // Spinning dizzy rotation
      avatar.current.rotation.y = time * 3.5;
    } else if (phase === 'apology') {
      // Humble apologetic bowing
      avatar.current.rotation.x = Math.abs(Math.sin(time * 3)) * 0.22;
    } else if (phase !== 'mud') {
      // Nervous jitter
      if (head.current) {
        head.current.rotation.y = Math.sin(time * 3) * 0.2;
      }
    }
  });

  return (
    <group ref={avatar} position={[4.8, 0, 2.2]} rotation={[0, -0.35, 0]}>
      {/* Orange Inmate Jumpsuit */}
      <mesh castShadow position={[0, 1.45, 0]}>
        <capsuleGeometry args={[0.46, 1.4, 6, 12]} />
        <meshStandardMaterial color="#e85d04" roughness={0.65} />
      </mesh>
      {/* Giant Mouse Cursor Pin on chest */}
      <mesh position={[0, 1.7, 0.46]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.22, 0.32, 0.04]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      <group ref={leftArm} position={[-0.48, 1.75, 0]} rotation={[0, 0, 0.32]}>
        <mesh castShadow position={[0, -0.48, 0]}>
          <capsuleGeometry args={[0.13, 0.72, 6, 10]} />
          <meshStandardMaterial color="#e85d04" roughness={0.65} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.48, 1.75, 0]} rotation={[0, 0, -0.32]}>
        <mesh castShadow position={[0, -0.48, 0]}>
          <capsuleGeometry args={[0.13, 0.72, 6, 10]} />
          <meshStandardMaterial color="#e85d04" roughness={0.65} />
        </mesh>
      </group>
      {/* Head */}
      <group ref={head} position={[0, 2.7, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.48, 18, 14]} />
          <meshStandardMaterial color="#d49a75" roughness={0.7} />
        </mesh>
        {/* Wide shock eyes */}
        {[-0.18, 0.18].map((x) => (
          <mesh key={x} position={[x, 0.06, 0.44]}>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* =========================================================================
   3. Interactive Gavel & Floating Evidence Holograms
   ========================================================================= */

function InteractiveGavel({
  phase,
  pulse,
  reducedMotion,
  onGavel,
}: {
  phase: TrialPhase;
  pulse: number;
  reducedMotion: boolean;
  onGavel(this: void): void;
}) {
  const gavel = useRef<Group>(null);

  useLayoutEffect(() => {
    if (!gavel.current) return;
    const context = gsap.context(() => {
      gsap.fromTo(
        gavel.current!.rotation,
        { z: -0.85 },
        {
          z: 0.22,
          duration: reducedMotion ? 0 : 0.2,
          repeat: reducedMotion ? 0 : 1,
          yoyo: true,
          ease: 'power4.in',
        },
      );
      gsap.fromTo(
        gavel.current!.position,
        { y: 3.3 },
        {
          y: 2.75,
          duration: reducedMotion ? 0 : 0.2,
          repeat: reducedMotion ? 0 : 1,
          yoyo: true,
          ease: 'power4.in',
        },
      );
    });
    return () => context.revert();
  }, [phase, pulse, reducedMotion]);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onGavel();
  };

  return (
    <group
      ref={gavel}
      position={[1.6, 2.95, -3.8]}
      rotation={[0.15, 0, 0.18]}
      onClick={handleClick}
    >
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 2.4, 18]} />
        <meshStandardMaterial color={WOOD_LIGHT} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[-1.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.44, 0.5, 0.95, 20]} />
        <meshStandardMaterial color="#34140a" roughness={0.28} />
      </mesh>
      {/* Brass gavel rings */}
      {[-0.4, 0.4].map((z) => (
        <mesh key={z} position={[-1.05, 0, z]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.46, 0.04, 10, 20]} />
          <meshStandardMaterial color={BRASS_GOLD} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function EvidenceTable({
  exhibits,
  phase,
}: {
  exhibits: readonly InteractionRecord[];
  phase: TrialPhase;
}) {
  const visible = phase === 'evidence' || phase === 'defense' || phase === 'objection';
  return (
    <group position={[0, 1.5, 1.6]} visible={visible}>
      {exhibits.map((record, index) => (
        <Float
          key={record.id}
          speed={1.2 + index * 0.09}
          rotationIntensity={0.1}
          floatIntensity={0.2}
        >
          <group
            position={[(index - (exhibits.length - 1) / 2) * 1.25, 0.38 + (index % 2) * 0.14, 0]}
            rotation={[-0.22, (index - 2) * 0.08, 0]}
          >
            <RoundedBox castShadow args={[0.95, 0.08, 1.25]} radius={0.05} smoothness={2}>
              <meshStandardMaterial color={index % 2 ? '#d4b378' : '#9c2033'} roughness={0.65} />
            </RoundedBox>
            <mesh position={[0, 0.06, -0.1]}>
              <planeGeometry args={[0.65, 0.55]} />
              <meshStandardMaterial color="#fff9ec" roughness={0.9} />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  );
}

/* =========================================================================
   4. Punishment Roulette & 3 Interactive Punishments
   ========================================================================= */

function RouletteWheel3D({
  phase,
  angle,
}: {
  phase: TrialPhase;
  angle: number;
  spinning: boolean;
}) {
  const visible = phase === 'roulette';
  const discRef = useRef<Group>(null);

  useFrame(() => {
    if (discRef.current) {
      discRef.current.rotation.y = angle;
    }
  });

  return (
    <group position={[0, 1.6, 0.8]} rotation={[0.34, 0, 0]} visible={visible}>
      {/* Glowing Outer Wheel Base */}
      <mesh castShadow rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.5, 2.6, 0.3, 36]} />
        <meshStandardMaterial color="#2a140d" roughness={0.4} />
      </mesh>
      {/* Brass Bezel */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.5, 0.15, 12, 36]} />
        <meshStandardMaterial color={BRASS_GOLD} metalness={0.88} roughness={0.18} />
      </mesh>

      {/* Rotating Disc with 3 Punishment Wedges */}
      <group ref={discRef} position={[0, 0.18, 0]}>
        {/* Wedge 1: Mud of Shame (Bronze) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.3, 2.3, 0.1, 32, 1, false, 0, (Math.PI * 2) / 3]} />
          <meshStandardMaterial color="#8c4e23" roughness={0.5} />
        </mesh>
        {/* Wedge 2: Human Spinner (Cyan) */}
        <mesh rotation={[-Math.PI / 2, 0, (Math.PI * 2) / 3]}>
          <cylinderGeometry args={[2.3, 2.3, 0.1, 32, 1, false, 0, (Math.PI * 2) / 3]} />
          <meshStandardMaterial color="#0077b6" roughness={0.4} />
        </mesh>
        {/* Wedge 3: Court-Ordered Apology (Crimson) */}
        <mesh rotation={[-Math.PI / 2, 0, (Math.PI * 4) / 3]}>
          <cylinderGeometry args={[2.3, 2.3, 0.1, 32, 1, false, 0, (Math.PI * 2) / 3]} />
          <meshStandardMaterial color="#9d0208" roughness={0.5} />
        </mesh>
        {/* Center Brass Spindle */}
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.42, 20, 16]} />
          <meshStandardMaterial color={BRASS_GOLD} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Needle Pointer Indicator */}
      <mesh position={[0, 0.38, 2.45]} rotation={[0, Math.PI, 0]}>
        <coneGeometry args={[0.22, 0.65, 12]} />
        <meshStandardMaterial color="#ff0044" roughness={0.3} />
      </mesh>
    </group>
  );
}

const SPLASH_PARTICLES = Array.from({ length: 24 }, (_, index) => {
  const seed = (index * 13) % 24;
  return {
    id: index,
    angle: (index / 24) * Math.PI * 2,
    dist: 0.6 + ((seed % 10) / 10) * 1.2,
    size: 0.08 + (((seed * 7) % 10) / 10) * 0.12,
    speed: 1.5 + (((seed * 3) % 10) / 10) * 2,
  };
});

function MudPuddleAndSplash({
  active,
}: {
  active: boolean;
  score: number;
  reducedMotion: boolean;
}) {
  return (
    <group position={[0, 0.02, 0.5]} visible={active}>
      {/* Glossy Cartoon Mud Puddle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.9, 36]} />
        <meshStandardMaterial color="#361a0d" roughness={0.16} metalness={0.12} />
      </mesh>
      {/* Ripple Rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[1.3, 1.45, 32]} />
        <meshStandardMaterial color="#4d2714" roughness={0.3} />
      </mesh>

      {/* Splash Particles popping up */}
      {SPLASH_PARTICLES.map((particle) => (
        <Float key={particle.id} speed={particle.speed} floatIntensity={0.8}>
          <mesh
            position={[
              Math.cos(particle.angle) * particle.dist,
              0.4 + particle.size * 2,
              Math.sin(particle.angle) * particle.dist,
            ]}
          >
            <sphereGeometry args={[particle.size, 10, 8]} />
            <meshStandardMaterial color="#421f10" roughness={0.3} />
          </mesh>
        </Float>
      ))}

      {/* Floating 3D Scoreboard */}
      <group position={[0, 2.6, 0]}>
        <RoundedBox args={[3.2, 1.2, 0.15]} radius={0.12} smoothness={3}>
          <meshStandardMaterial color="#21100a" roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, 0, 0.09]}>
          <planeGeometry args={[2.9, 0.95]} />
          <meshStandardMaterial color="#fff3db" roughness={0.9} />
        </mesh>
        {/* Decorative Gold Stars */}
        {[-0.8, 0, 0.8].map((x) => (
          <mesh key={x} position={[x, 0.22, 0.11]}>
            <sphereGeometry args={[0.12, 12, 8]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.8} />
          </mesh>
        ))}
        {/* Score Stamp Marker */}
        <mesh position={[0, -0.16, 0.11]}>
          <boxGeometry args={[1.4, 0.38, 0.02]} />
          <meshStandardMaterial color={CARPET_RED} />
        </mesh>
      </group>
    </group>
  );
}

function HumanLoadingSpinner3D({
  active,
  progress,
}: {
  active: boolean;
  progress: number;
  onDragDelta?: ((delta: number) => void) | undefined;
}) {
  const ringRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = -clock.getElapsedTime() * 4;
  });

  return (
    <group position={[0, 1.4, 0.5]} visible={active}>
      {/* Giant 3D Buffering Wheel Ring */}
      <group ref={ringRef}>
        <mesh>
          <torusGeometry args={[1.8, 0.18, 14, 42, Math.PI * 1.65]} />
          <meshStandardMaterial
            color="#00b4d8"
            emissive="#0077b6"
            emissiveIntensity={1.8}
            roughness={0.2}
          />
        </mesh>
        {/* Accent Loading Dots */}
        {[0, 0.7, 1.4, 2.1].map((offset) => (
          <mesh key={offset} position={[Math.cos(offset) * 1.8, Math.sin(offset) * 1.8, 0]}>
            <sphereGeometry args={[0.22, 12, 10]} />
            <meshStandardMaterial color="#90e0ef" emissive="#00b4d8" emissiveIntensity={2.5} />
          </mesh>
        ))}
      </group>

      {/* Progress Arc Indicator */}
      <mesh position={[0, -2.1, 0]}>
        <boxGeometry args={[progress * 0.038, 0.22, 0.1]} />
        <meshStandardMaterial color="#00f5d4" emissive="#00b4d8" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

function ApologyPodium({ active }: { active: boolean }) {
  return (
    <group position={[0, 0, 0.8]} visible={active}>
      {/* Microphone Stand */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 1.6, 12]} />
        <meshStandardMaterial color={BRASS_GOLD} metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.14, 14, 10]} />
        <meshStandardMaterial color="#222" roughness={0.3} />
      </mesh>
    </group>
  );
}

/* =========================================================================
   5. Confetti Climax (Appeal Denied Twist)
   ========================================================================= */

const CONFETTI_COLORS = ['#f2be42', '#e63946', '#00b4d8', '#ff0054', '#70e000'] as const;

const CONFETTI_PARTICLES = Array.from({ length: 90 }, (_, index) => {
  const s1 = ((index * 37) % 100) / 100;
  const s2 = ((index * 53) % 100) / 100;
  const s3 = ((index * 79) % 100) / 100;
  return {
    id: index,
    x: (s1 - 0.5) * 14,
    y: 4 + s2 * 5,
    z: (s3 - 0.5) * 10,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length] as string,
    speed: 1.5 + s1 * 2,
    rotSpeed: 2 + s2 * 5,
  };
});

function AppealConfetti({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group>
      <Sparkles count={110} scale={[16, 9, 14]} size={3.5} speed={0.8} color="#ffe28a" />
      {!reducedMotion && CONFETTI_PARTICLES.map((p) => <ConfettiFlake key={p.id} {...p} />)}
    </group>
  );
}

function ConfettiFlake({
  x,
  y,
  z,
  color,
  speed,
  rotSpeed,
}: {
  x: number;
  y: number;
  z: number;
  color: string;
  speed: number;
  rotSpeed: number;
}) {
  const mesh = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const time = clock.getElapsedTime();
    mesh.current.position.y = y - ((time * speed) % 6);
    mesh.current.rotation.x = time * rotSpeed;
    mesh.current.rotation.z = time * rotSpeed * 0.7;
  });

  return (
    <mesh ref={mesh} position={[x, y, z]}>
      <boxGeometry args={[0.18, 0.18, 0.02]} />
      <meshStandardMaterial color={color} roughness={0.3} />
    </mesh>
  );
}

/* =========================================================================
   6. Camera Director (Cinematic cuts & framing)
   ========================================================================= */

const CAMERA_SHOTS: Record<
  string,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  // Pushed back through doors, gliding smoothly into the majestic warm courtroom
  summons: { position: [0, 3.2, 9.8], target: [0, 2.6, -4.8] },
  evidence: { position: [4.8, 3.1, 7.2], target: [0, 1.7, 1.1] },
  defense: { position: [2.2, 2.6, 5.8], target: [2.8, 1.8, 2.4] },
  // Dramatic whip pan Dutch angle on prosecutor shouting OBJECTION!
  objection: { position: [-3.8, 2.6, 3.2], target: [-5.8, 2.2, -0.7] },
  // Low angle looking up at the towering Judge
  verdict: { position: [0, 2.9, 1.8], target: [0, 3.4, -5.1] },
  // Front angle focused on the sentence wheel
  roulette: { position: [0, 3.8, 5.2], target: [0, 1.8, 0.8] },
  // Tracking shot of defendant front roll into the mud puddle
  mud: { position: [3.6, 2.5, 3.8], target: [0, 0.8, 0.5] },
  // Centered on the buffering wheel
  spinner: { position: [0, 2.5, 3.8], target: [0, 1.8, 0.5] },
  // Split perspective on confession microphone
  apology: { position: [1.6, 2.4, 3.8], target: [0, 1.6, 0.8] },
  // Dramatic rapid push-in straight into the Judge's furious face!
  appeal: { position: [0, 3.6, -1.8], target: [0, 3.6, -5.1] },
  // Character close-ups
  judge: { position: [0.1, 3.7, 0.5], target: [0, 3.5, -5.1] },
  prosecutor: { position: [-3.2, 2.4, 2.4], target: [-5.8, 2.2, -0.7] },
  defenseSpeaker: { position: [1.2, 2.4, 4.8], target: [2.9, 1.8, 2.6] },
  defendant: { position: [2.2, 2.55, 5.2], target: [4.8, 2.0, 2.2] },
  assistant: { position: [1.2, 2.4, 4.8], target: [2.9, 1.8, 2.6] },
  clerk: { position: [0, 2.0, -1.6], target: [0, 1.4, -3.2] },
};

const DEFAULT_CAMERA_SHOT = { position: [0, 3.2, 9.8], target: [0, 2.6, -4.8] } as const;

function CameraDirector({
  phase,
  speaker,
  reducedMotion,
}: {
  phase: TrialPhase;
  speaker: CourtroomSpeaker | null;
  reducedMotion: boolean;
}) {
  const { camera } = useThree();
  const focus = useRef({ x: 0, y: 2.6, z: -4.8 });

  // Map speaker to camera key if in dialogue
  const shotKey =
    speaker === 'defense' ? 'defenseSpeaker' : speaker && CAMERA_SHOTS[speaker] ? speaker : phase;
  const shot = CAMERA_SHOTS[shotKey] ?? CAMERA_SHOTS[phase] ?? DEFAULT_CAMERA_SHOT;

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const isAppeal = phase === 'appeal';
      const duration = reducedMotion ? 0 : isAppeal ? 0.35 : phase === 'summons' ? 2.6 : 1.1;
      const ease = isAppeal ? 'power4.out' : 'power3.inOut';

      gsap.to(camera.position, {
        x: shot.position[0],
        y: shot.position[1],
        z: shot.position[2],
        duration,
        ease,
      });
      gsap.to(focus.current, {
        x: shot.target[0],
        y: shot.target[1],
        z: shot.target[2],
        duration,
        ease,
      });
    });
    return () => context.revert();
  }, [camera, phase, reducedMotion, shot]);

  useFrame(() => camera.lookAt(focus.current.x, focus.current.y, focus.current.z));
  return null;
}
