import { useLayoutEffect, useRef, type Ref } from 'react';
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Float, RoundedBox, Sparkles } from '@react-three/drei';
import { gsap } from 'gsap';
import type { Group } from 'three';
import type { CourtroomSpeaker } from '@/audio';
import type { DefenseId } from '@/components/courtroom/trialLogic';
import type { InteractionRecord } from '@/shared/contracts';

export type TrialPhase =
  'summons' | 'evidence' | 'defense' | 'objection' | 'verdict' | 'certificate';

interface CourtroomScene3DProps {
  phase: TrialPhase;
  speaker: CourtroomSpeaker | null;
  exhibits: readonly InteractionRecord[];
  selectedDefense: DefenseId | null;
  reducedMotion: boolean;
  gavelPulse: number;
  onGavel(this: void): void;
}

const WOOD = '#341a0d';
const WOOD_LIGHT = '#6b351a';
const BRASS = '#d9a441';
const RED = '#55131b';

export default function CourtroomScene3D(props: CourtroomScene3DProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 2.8, 14], fov: 45, near: 0.1, far: 80 }}
      shadows
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      fallback={<div className="court-webgl-fallback" aria-hidden="true" />}
    >
      <color attach="background" args={['#030202']} />
      <fog attach="fog" args={['#080404', 14, 42]} />
      <ambientLight intensity={0.18} color="#8ea2c8" />
      <spotLight
        castShadow
        position={[0, 10, 2]}
        angle={0.45}
        penumbra={0.75}
        intensity={65}
        color="#ffd18a"
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight position={[-8, 5, 6]} intensity={24} angle={0.6} color="#b91c3d" />
      <spotLight position={[7, 4, 4]} intensity={20} angle={0.5} color="#2458a6" />
      <CourtroomArchitecture />
      <CourtroomDoors phase={props.phase} reducedMotion={props.reducedMotion} />
      <JudgeCharacter
        phase={props.phase}
        speaker={props.speaker}
        selectedDefense={props.selectedDefense}
        reducedMotion={props.reducedMotion}
      />
      <ProsecutorCharacter phase={props.phase} speaker={props.speaker} />
      <AssistantCharacter speaker={props.speaker} />
      <EvidenceTable exhibits={props.exhibits} phase={props.phase} />
      <InteractiveGavel
        phase={props.phase}
        pulse={props.gavelPulse}
        reducedMotion={props.reducedMotion}
        onGavel={props.onGavel}
      />
      <JuryBox />
      <CameraDirector
        phase={props.phase}
        speaker={props.speaker}
        reducedMotion={props.reducedMotion}
      />
      <ContactShadows position={[0, 0.025, 0]} opacity={0.58} scale={27} blur={2.5} far={8} />
      <Environment preset="night" environmentIntensity={0.18} />
      {props.phase === 'verdict' ? (
        <Sparkles count={55} scale={[13, 7, 12]} size={2.2} speed={0.35} color="#f5c66b" />
      ) : null}
    </Canvas>
  );
}

function CourtroomArchitecture() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[32, 40]} />
        <meshStandardMaterial color="#190e09" roughness={0.72} metalness={0.05} />
      </mesh>
      {Array.from({ length: 13 }, (_, index) => (
        <mesh
          key={index}
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.012, index * 1.5 - 8]}
        >
          <planeGeometry args={[25, 0.025]} />
          <meshStandardMaterial color={index % 2 ? '#8e5c2b' : '#4b2c15'} roughness={0.8} />
        </mesh>
      ))}
      <mesh receiveShadow position={[0, 5, -8.5]}>
        <boxGeometry args={[25, 10, 0.5]} />
        <meshStandardMaterial color="#15100e" roughness={0.86} />
      </mesh>
      <mesh receiveShadow position={[-12.5, 4.5, 1]}>
        <boxGeometry args={[0.45, 9, 20]} />
        <meshStandardMaterial color="#100d0d" />
      </mesh>
      <mesh receiveShadow position={[12.5, 4.5, 1]}>
        <boxGeometry args={[0.45, 9, 20]} />
        <meshStandardMaterial color="#100d0d" />
      </mesh>
      {[-8, 8].map((x) => (
        <group key={x} position={[x, 0, -7.9]}>
          <mesh castShadow position={[0, 3.6, 0.35]}>
            <cylinderGeometry args={[0.42, 0.55, 7.2, 12]} />
            <meshStandardMaterial color="#5c4a3a" roughness={0.45} />
          </mesh>
          <mesh castShadow position={[0, 7.1, 0.35]}>
            <boxGeometry args={[1.4, 0.42, 1]} />
            <meshStandardMaterial color={BRASS} metalness={0.68} roughness={0.27} />
          </mesh>
        </group>
      ))}
      <Bench position={[0, 1.25, -5.6]} scale={[7.8, 2.5, 1.65]} />
      <Bench position={[-7.4, 0.72, -2.3]} scale={[3.5, 1.45, 2.2]} />
      <Bench position={[0, 0.62, 2.8]} scale={[4.4, 1.25, 2]} />
      <WitnessStand />
      <CourtSeal />
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
      radius={0.12}
      smoothness={3}
    >
      <meshStandardMaterial color={WOOD} roughness={0.4} metalness={0.12} />
    </RoundedBox>
  );
}

function CourtSeal() {
  return (
    <group position={[0, 5.3, -8.15]} rotation={[0, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[1.22, 1.22, 0.18, 48]} />
        <meshStandardMaterial color={BRASS} metalness={0.78} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <torusGeometry args={[0.78, 0.12, 10, 40]} />
        <meshStandardMaterial color="#2b160d" metalness={0.4} />
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
      const duration = reducedMotion ? 0 : 1.8;
      gsap.to(left.current!.rotation, {
        y: -1.28,
        duration,
        delay: reducedMotion ? 0 : 0.35,
        ease: 'power3.inOut',
      });
      gsap.to(right.current!.rotation, {
        y: 1.28,
        duration,
        delay: reducedMotion ? 0 : 0.35,
        ease: 'power3.inOut',
      });
    });
    return () => context.revert();
  }, [phase, reducedMotion]);

  return (
    <group position={[0, 0, 8.7]}>
      <group ref={left} position={[-2.15, 0, 0]}>
        <mesh castShadow position={[2.15, 2.8, 0]}>
          <boxGeometry args={[4.25, 5.6, 0.25]} />
          <meshStandardMaterial color="#281309" roughness={0.38} />
        </mesh>
      </group>
      <group ref={right} position={[2.15, 0, 0]}>
        <mesh castShadow position={[-2.15, 2.8, 0]}>
          <boxGeometry args={[4.25, 5.6, 0.25]} />
          <meshStandardMaterial color="#281309" roughness={0.38} />
        </mesh>
      </group>
    </group>
  );
}

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

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const time = clock.getElapsedTime();
    if (head.current) {
      head.current.rotation.z =
        Math.sin(time * (speaker === 'judge' ? 7 : 1.5)) * (speaker === 'judge' ? 0.035 : 0.012);
      head.current.rotation.y =
        selectedDefense === 'mouse' ? -0.18 : selectedDefense === 'javascript' ? 0.18 : 0;
      head.current.position.y = 2.7 + Math.sin(time * 2.2) * 0.025;
    }
    if (arm.current)
      arm.current.rotation.x = phase === 'objection' ? -1.2 : Math.sin(time * 1.4) * 0.05;
  });

  useLayoutEffect(() => {
    if (!character.current) return;
    const context = gsap.context(() => {
      if (phase === 'verdict' || phase === 'objection') {
        gsap.fromTo(
          character.current!.scale,
          { x: 1.15, y: 0.88, z: 1.15 },
          { x: 1, y: 1, z: 1, duration: 0.55, ease: 'elastic.out(1, 0.35)' },
        );
      }
    });
    return () => context.revert();
  }, [phase]);

  return (
    <group ref={character} position={[0, 2.4, -5.05]}>
      <mesh castShadow position={[0, 1.25, 0]}>
        <capsuleGeometry args={[0.72, 1.6, 8, 16]} />
        <meshStandardMaterial color="#17171c" roughness={0.65} />
      </mesh>
      <group ref={head} position={[0, 2.7, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.72, 24, 18]} />
          <meshStandardMaterial color="#8d6047" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.28, -0.05]} scale={[1.08, 0.52, 1.04]}>
          <sphereGeometry args={[0.7, 20, 14]} />
          <meshStandardMaterial color="#e5e1d9" roughness={0.95} />
        </mesh>
        {[-0.25, 0.25].map((x) => (
          <group key={x} position={[x, 0.08, 0.66]}>
            <mesh scale={[1, phase === 'objection' ? 0.45 : 1, 1]}>
              <sphereGeometry args={[0.07, 12, 8]} />
              <meshStandardMaterial color="#090806" />
            </mesh>
            <mesh position={[0, 0.12, 0.015]} rotation={[0, 0, x < 0 ? -0.22 : 0.22]}>
              <boxGeometry args={[0.25, 0.045, 0.05]} />
              <meshStandardMaterial color="#2e211b" />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={arm} position={[0.9, 1.45, 0.2]} rotation={[0, 0, -0.45]}>
        <mesh castShadow position={[0, -0.55, 0]}>
          <capsuleGeometry args={[0.17, 0.9, 6, 10]} />
          <meshStandardMaterial color="#17171c" />
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
  useFrame(({ clock }) => {
    if (!group.current) return;
    const active = speaker === 'prosecutor' || phase === 'objection';
    group.current.rotation.z = active ? Math.sin(clock.getElapsedTime() * 8) * 0.025 : 0;
  });
  return (
    <StylizedPerson
      groupRef={group}
      position={[-5.8, 0, -0.8]}
      suit="#4c101b"
      skin="#c98562"
      accent="#e5b555"
    />
  );
}

function AssistantCharacter({ speaker }: { speaker: CourtroomSpeaker | null }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.y =
      speaker === 'assistant' ? Math.abs(Math.sin(clock.getElapsedTime() * 12)) * 0.06 : 0;
  });
  return (
    <StylizedPerson
      groupRef={group}
      position={[2.9, 0, 3.6]}
      suit="#17304b"
      skin="#d49b75"
      accent="#78d5d7"
    />
  );
}

const StylizedPerson = ({
  groupRef,
  position,
  suit,
  skin,
  accent,
}: {
  groupRef: Ref<Group>;
  position: [number, number, number];
  suit: string;
  skin: string;
  accent: string;
}) => (
  <group ref={groupRef} position={position}>
    <mesh castShadow position={[0, 1.5, 0]}>
      <capsuleGeometry args={[0.48, 1.45, 6, 12]} />
      <meshStandardMaterial color={suit} roughness={0.62} />
    </mesh>
    <mesh castShadow position={[0, 2.75, 0]}>
      <sphereGeometry args={[0.52, 18, 14]} />
      <meshStandardMaterial color={skin} roughness={0.76} />
    </mesh>
    <mesh position={[0, 1.75, 0.48]} rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[0.22, 0.22, 0.05]} />
      <meshStandardMaterial color={accent} metalness={0.3} />
    </mesh>
  </group>
);

function EvidenceTable({
  exhibits,
  phase,
}: {
  exhibits: readonly InteractionRecord[];
  phase: TrialPhase;
}) {
  const visible = phase === 'evidence' || phase === 'defense' || phase === 'objection';
  return (
    <group position={[0, 1.45, 1.6]} visible={visible}>
      {exhibits.map((record, index) => (
        <Float
          key={record.id}
          speed={1.1 + index * 0.08}
          rotationIntensity={0.08}
          floatIntensity={0.16}
        >
          <group
            position={[(index - (exhibits.length - 1) / 2) * 1.15, 0.35 + (index % 2) * 0.13, 0]}
            rotation={[-0.22, (index - 2) * 0.08, 0]}
          >
            <RoundedBox castShadow args={[0.92, 0.07, 1.18]} radius={0.045} smoothness={2}>
              <meshStandardMaterial color={index % 2 ? '#c9ab72' : '#8d1d2f'} roughness={0.7} />
            </RoundedBox>
            <mesh position={[0, 0.055, -0.1]}>
              <planeGeometry args={[0.62, 0.5]} />
              <meshStandardMaterial color="#eee4cb" roughness={0.9} />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  );
}

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
        { z: -0.9 },
        {
          z: 0.18,
          duration: reducedMotion ? 0 : 0.22,
          repeat: reducedMotion ? 0 : 1,
          yoyo: true,
          ease: 'power4.in',
        },
      );
      gsap.fromTo(
        gavel.current!.position,
        { y: 3.2 },
        {
          y: 2.65,
          duration: reducedMotion ? 0 : 0.22,
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
      position={[1.65, 2.9, -3.8]}
      rotation={[0.15, 0, 0.18]}
      onClick={handleClick}
    >
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.19, 0.19, 2.3, 18]} />
        <meshStandardMaterial color={WOOD_LIGHT} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[-1.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.48, 0.9, 20]} />
        <meshStandardMaterial color="#2b1008" roughness={0.28} />
      </mesh>
    </group>
  );
}

function WitnessStand() {
  return (
    <group position={[6.9, 0, -2.3]}>
      <Bench position={[0, 0.82, 0]} scale={[3.1, 1.65, 2.3]} />
      <mesh castShadow position={[0, 1.82, -0.72]}>
        <boxGeometry args={[3.2, 0.18, 0.18]} />
        <meshStandardMaterial color={BRASS} metalness={0.65} />
      </mesh>
    </group>
  );
}

function JuryBox() {
  return (
    <group position={[8.2, 0, 1.2]}>
      {Array.from({ length: 6 }, (_, index) => (
        <group key={index} position={[(index % 2) * 1.3, 0, Math.floor(index / 2) * 1.35]}>
          <mesh castShadow position={[0, 0.65, 0]}>
            <boxGeometry args={[1.05, 0.18, 1]} />
            <meshStandardMaterial color={RED} roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, 1.15, 0.42]}>
            <boxGeometry args={[1.05, 1, 0.16]} />
            <meshStandardMaterial color={RED} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const CAMERA_SHOTS: Record<
  string,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  summons: { position: [0, 2.9, 8.7], target: [0, 2.6, -4.8] },
  evidence: { position: [4.8, 3.1, 7.2], target: [0, 1.7, 1.1] },
  defense: { position: [0, 3.1, 7.8], target: [1.2, 1.7, 2.1] },
  objection: { position: [-4.1, 2.7, 3.5], target: [-5.6, 2, -0.8] },
  verdict: { position: [0, 3.45, 2.6], target: [0, 3.3, -5] },
  judge: { position: [0.1, 3.8, 0.8], target: [0, 3.5, -5] },
  prosecutor: { position: [-2.5, 2.4, 3.2], target: [-5.7, 2, -0.8] },
  assistant: { position: [0.7, 2.3, 6.4], target: [2.9, 1.8, 3.6] },
};
const DEFAULT_CAMERA_SHOT = { position: [0, 2.9, 8.7], target: [0, 2.6, -4.8] } as const;

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
  const shot = CAMERA_SHOTS[speaker ?? phase] ?? DEFAULT_CAMERA_SHOT;

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const duration = reducedMotion ? 0 : phase === 'summons' ? 2.8 : 1.05;
      gsap.to(camera.position, {
        x: shot.position[0],
        y: shot.position[1],
        z: shot.position[2],
        duration,
        ease: 'power3.inOut',
      });
      gsap.to(focus.current, {
        x: shot.target[0],
        y: shot.target[1],
        z: shot.target[2],
        duration,
        ease: 'power3.inOut',
      });
    });
    return () => context.revert();
  }, [camera, phase, reducedMotion, shot]);

  useFrame(() => camera.lookAt(focus.current.x, focus.current.y, focus.current.z));
  return null;
}
