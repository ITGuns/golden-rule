"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Cinematic hero: a stylized condenser unit floating in a dark architectural
 * space. Fan spins, airflow particles rise through the cabinet, the camera
 * breathes with the cursor, and scroll pulls the rig downward into the page.
 * Fully procedural — no external GLTF to load.
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
          <meshStandardMaterial color="#3a4150" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.16, 24]} />
        <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} />
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
        <meshStandardMaterial color="#1b2230" metalness={0.55} roughness={0.4} />
      </mesh>
      {/* corner posts */}
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} position={[x * 1.13, 0, z * 1.13]}>
            <boxGeometry args={[0.1, 1.94, 0.1]} />
            <meshStandardMaterial color="#0d1118" metalness={0.7} roughness={0.3} />
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
                <meshStandardMaterial color="#2b3444" metalness={0.6} roughness={0.35} />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* top ring & grille */}
      <mesh position={[0, 0.99, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.02, 1.14, 48]} />
        <meshStandardMaterial color={GOLD} metalness={0.65} roughness={0.25} side={THREE.DoubleSide} />
      </mesh>
      {[0.25, 0.5, 0.75, 1.0].map((r) => (
        <mesh key={r} position={[0, 1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.012, 8, 48]} />
          <meshStandardMaterial color="#454f61" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* base plinth */}
      <mesh position={[0, -1.06, 0]}>
        <boxGeometry args={[2.5, 0.18, 2.5]} />
        <meshStandardMaterial color="#0a0d13" metalness={0.4} roughness={0.6} />
      </mesh>
      <FanBlades />
    </group>
  );
}

function AirParticles({ count = 320 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const seeds = useMemo(() => {
    const arr = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      arr[i * 4] = Math.random() * Math.PI * 2; // angle
      arr[i * 4 + 1] = 0.2 + Math.random() * 0.85; // radius
      arr[i * 4 + 2] = Math.random(); // phase 0..1
      arr[i * 4 + 3] = 0.4 + Math.random() * 0.9; // speed
    }
    return arr;
  }, [count]);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const angle = seeds[i * 4] + t * 0.25;
      const radius = seeds[i * 4 + 1];
      const phase = (seeds[i * 4 + 2] + t * 0.09 * seeds[i * 4 + 3]) % 1;
      // particles get drawn in through the louvers (wide) and exhaust out the top (narrow, fast)
      const y = -1 + phase * 3.4;
      const squeeze = phase < 0.55 ? 1 - phase * 0.5 : 0.72 - (phase - 0.55) * 0.6;
      positions[i * 3] = Math.cos(angle) * radius * (1.35 * squeeze);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius * (1.35 * squeeze);
    }
    if (points.current) {
      (points.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={GOLD}
        size={0.035}
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Rig({ scrollRef }: { scrollRef?: React.RefObject<number> }) {
  const { camera, pointer } = useThree();
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const scroll = scrollRef?.current ?? 0;
    // cursor breathing
    const targetX = pointer.x * 0.55;
    const targetY = 1.35 + pointer.y * 0.3 - scroll * 2.2;
    camera.position.x += (targetX - camera.position.x) * Math.min(1, dt * 2.2);
    camera.position.y += (targetY - camera.position.y) * Math.min(1, dt * 2.2);
    camera.lookAt(0, 0.15 - scroll * 1.2, 0);
    if (group.current) {
      group.current.rotation.y += dt * 0.12 + pointer.x * dt * 0.18;
    }
  });
  return (
    <group ref={group} position={[0, -0.1, 0]}>
      <Cabinet />
      <AirParticles />
    </group>
  );
}

export function HeroScene({ scrollRef }: { scrollRef?: React.RefObject<number> }) {
  return (
    <>
      <fog attach="fog" args={["#0b0f17", 7, 16]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 3]} intensity={1.4} color="#dfe8ff" />
      <pointLight position={[-4, 2, -2]} intensity={12} color="#fccd35" distance={12} />
      <pointLight position={[0, -1.5, 3.5]} intensity={5} color="#5e77ff" distance={9} />
      {/* floor shadow-ish disc */}
      <mesh position={[0, -1.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.4, 48]} />
        <meshBasicMaterial color="#05070b" transparent opacity={0.85} />
      </mesh>
      <Rig scrollRef={scrollRef} />
    </>
  );
}
