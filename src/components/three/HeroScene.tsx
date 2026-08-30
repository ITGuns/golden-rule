"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Cinematic hero: a stylized condenser unit on a glowing radar plinth inside a
 * dark architectural space. Cool air is drawn in through the louvers, a gold
 * exhaust plume rises from the fan, dust motes drift in the depth, the camera
 * breathes with the cursor and drifts on idle, and scroll pulls the rig down
 * into the page. Fully procedural — no external GLTF to load.
 */

const GOLD = new THREE.Color("#fccd35");

function FanBlades() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 3.4;
  });
  const blade = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.1);
    shape.quadraticCurveTo(0.55, 0.32, 1.05, 0.1);
    shape.quadraticCurveTo(1.1, -0.12, 0.95, -0.22);
    shape.quadraticCurveTo(0.45, -0.05, 0, -0.1);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false });
  }, []);
  return (
    <group ref={group} position={[0, 1.02, 0]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          geometry={blade}
          rotation={[-Math.PI / 2, 0, (i * Math.PI * 2) / 5]}
          position={[0, 0, 0]}
        >
          <meshStandardMaterial color="#3a4150" metalness={0.75} roughness={0.3} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.16, 24]} />
        <meshStandardMaterial color={GOLD} metalness={0.65} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Cabinet() {
  const louvers = useMemo(() => {
    const arr: { y: number }[] = [];
    for (let i = 0; i < 9; i++) arr.push({ y: -0.72 + i * 0.19 });
    return arr;
  }, []);
  return (
    <group>
      {/* main body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.3, 1.9, 2.3]} />
        <meshStandardMaterial color="#1b2230" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* corner posts */}
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} position={[x * 1.13, 0, z * 1.13]}>
            <boxGeometry args={[0.1, 1.94, 0.1]} />
            <meshStandardMaterial color="#0d1118" metalness={0.75} roughness={0.25} />
          </mesh>
        ))
      )}
      {/* louvers on all four sides */}
      {[0, 1, 2, 3].map((side) => {
        const rot = (side * Math.PI) / 2;
        return (
          <group key={side} rotation={[0, rot, 0]}>
            {louvers.map((l, i) => (
              <mesh key={i} position={[0, l.y, 1.165]}>
                <boxGeometry args={[2.05, 0.055, 0.03]} />
                <meshStandardMaterial color="#2b3444" metalness={0.65} roughness={0.3} />
              </mesh>
            ))}
            {/* thin emissive accent strip under the top ring */}
            <mesh position={[0, 0.93, 1.17]}>
              <boxGeometry args={[2.05, 0.018, 0.012]} />
              <meshStandardMaterial
                color={GOLD}
                emissive={GOLD}
                emissiveIntensity={0.9}
                metalness={0.4}
                roughness={0.4}
              />
            </mesh>
          </group>
        );
      })}
      {/* top ring & grille */}
      <mesh position={[0, 0.99, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.02, 1.14, 48]} />
        <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      {[0.25, 0.5, 0.75, 1.0].map((r) => (
        <mesh key={r} position={[0, 1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.012, 8, 48]} />
          <meshStandardMaterial color="#454f61" metalness={0.75} roughness={0.25} />
        </mesh>
      ))}
      {/* base plinth */}
      <mesh position={[0, -1.06, 0]}>
        <boxGeometry args={[2.5, 0.18, 2.5]} />
        <meshStandardMaterial color="#0a0d13" metalness={0.45} roughness={0.55} />
      </mesh>
      <FanBlades />
    </group>
  );
}

/** Cool air drawn toward the louvers around the lower cabinet. */
function IntakeParticles({ count = 170 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const seeds = useMemo(() => {
    const arr = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      arr[i * 4] = Math.random() * Math.PI * 2; // angle
      arr[i * 4 + 1] = 0.6 + Math.random() * 0.4; // radius factor
      arr[i * 4 + 2] = Math.random(); // phase
      arr[i * 4 + 3] = 0.5 + Math.random() * 0.8; // speed
    }
    return arr;
  }, [count]);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const angle = seeds[i * 4] + t * 0.18;
      const phase = (seeds[i * 4 + 2] + t * 0.07 * seeds[i * 4 + 3]) % 1;
      // spiral inward from far out toward the louvers
      const radius = (3.4 - phase * 2.1) * seeds[i * 4 + 1];
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -0.9 + phase * 1.3 + Math.sin(angle * 3) * 0.08;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    if (points.current)
      (points.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#6fb6ff"
        size={0.03}
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Gold exhaust plume rising from the fan. */
function ExhaustParticles({ count = 240 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const seeds = useMemo(() => {
    const arr = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      arr[i * 4] = Math.random() * Math.PI * 2;
      arr[i * 4 + 1] = 0.15 + Math.random() * 0.65;
      arr[i * 4 + 2] = Math.random();
      arr[i * 4 + 3] = 0.6 + Math.random() * 0.9;
    }
    return arr;
  }, [count]);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const angle = seeds[i * 4] + t * 0.4;
      const phase = (seeds[i * 4 + 2] + t * 0.11 * seeds[i * 4 + 3]) % 1;
      const spread = seeds[i * 4 + 1] * (0.55 + phase * 0.8);
      positions[i * 3] = Math.cos(angle) * spread;
      positions[i * 3 + 1] = 1.1 + phase * 2.6;
      positions[i * 3 + 2] = Math.sin(angle) * spread;
    }
    if (points.current)
      (points.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={GOLD}
        size={0.038}
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Ambient dust motes drifting far behind the unit. */
function DustField({ count = 220 }: { count?: number }) {
  const group = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 7 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      arr[i * 3] = Math.cos(theta) * r;
      arr[i * 3 + 1] = -2 + Math.random() * 8;
      arr[i * 3 + 2] = Math.sin(theta) * r - 2;
    }
    return arr;
  }, [count]);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.008;
  });
  return (
    <points ref={group}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#8fa3c8"
        size={0.05}
        transparent
        opacity={0.32}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Radar-style ground: soft gold glow + concentric hairline rings. */
function GroundRadar() {
  const glowTexture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(252,205,53,0.32)");
    g.addColorStop(0.4, "rgba(252,205,53,0.10)");
    g.addColorStop(1, "rgba(252,205,53,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }, []);
  return (
    <group position={[0, -1.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* dark grounding disc */}
      <mesh>
        <circleGeometry args={[4.4, 56]} />
        <meshBasicMaterial color="#05070b" transparent opacity={0.9} />
      </mesh>
      {/* gold glow pool */}
      <mesh position={[0, 0, 0.005]}>
        <circleGeometry args={[2.9, 48]} />
        <meshBasicMaterial map={glowTexture} transparent depthWrite={false} />
      </mesh>
      {/* concentric hairlines */}
      {[1.9, 2.7, 3.5].map((r, i) => (
        <mesh key={r} position={[0, 0, 0.01]}>
          <ringGeometry args={[r - 0.012, r, 96]} />
          <meshBasicMaterial
            color={i === 0 ? "#c8a53a" : "#2a3650"}
            transparent
            opacity={i === 0 ? 0.35 : 0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function Rig({ scrollRef }: { scrollRef?: React.RefObject<number> }) {
  const { camera, pointer } = useThree();
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const scroll = scrollRef?.current ?? 0;
    // cursor breathing + slow idle drift
    const targetX = pointer.x * 0.55 + Math.sin(t * 0.14) * 0.18;
    const targetY = 1.35 + pointer.y * 0.3 + Math.cos(t * 0.11) * 0.08 - scroll * 2.2;
    camera.position.x += (targetX - camera.position.x) * Math.min(1, dt * 2.2);
    camera.position.y += (targetY - camera.position.y) * Math.min(1, dt * 2.2);
    camera.lookAt(0, 0.15 - scroll * 1.2, 0);
    if (group.current) {
      group.current.rotation.y += dt * 0.12 + pointer.x * dt * 0.18;
      group.current.position.y = -0.1 + Math.sin(t * 0.8) * 0.045;
    }
  });
  return (
    <group ref={group} position={[0, -0.1, 0]}>
      <Cabinet />
      <IntakeParticles />
      <ExhaustParticles />
    </group>
  );
}

export function HeroScene({ scrollRef }: { scrollRef?: React.RefObject<number> }) {
  return (
    <>
      <fog attach="fog" args={["#0b0f17", 7, 17]} />
      <ambientLight intensity={0.42} />
      <directionalLight position={[4, 6, 3]} intensity={1.5} color="#dfe8ff" />
      {/* cool rim light from behind for silhouette definition */}
      <directionalLight position={[-3, 2.5, -5]} intensity={1.1} color="#4d6cff" />
      <pointLight position={[-4, 2, -2]} intensity={12} color="#fccd35" distance={12} />
      <pointLight position={[0, -1.5, 3.5]} intensity={5} color="#5e77ff" distance={9} />
      {/* warm glow rising with the exhaust */}
      <pointLight position={[0, 2.6, 0]} intensity={6} color="#fccd35" distance={6} />
      <DustField />
      <GroundRadar />
      <Rig scrollRef={scrollRef} />
    </>
  );
}
