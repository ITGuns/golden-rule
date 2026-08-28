"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type AirflowMode = "cooling" | "heating" | "filtration";

const MODE_COLOR: Record<AirflowMode, string> = {
  cooling: "#7cc4ff",
  heating: "#ff9d54",
  filtration: "#9effa9",
};

/**
 * The journey of a single breath of air:
 * HOME → RETURN AIR → FILTER → AIR HANDLER → COIL → SUPPLY AIR → ROOM
 * Particles ride a closed loop; their color and the coil's glow follow the mode.
 */
export function AirflowScene({ mode }: { mode: AirflowMode }) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-3.4, 0.4, 0), // room
          new THREE.Vector3(-2.6, -0.9, 0), // return drop
          new THREE.Vector3(-1.2, -1.1, 0), // filter
          new THREE.Vector3(0.2, -1.0, 0), // handler
          new THREE.Vector3(1.1, -0.2, 0), // coil rise
          new THREE.Vector3(1.6, 1.1, 0), // supply plenum
          new THREE.Vector3(0.2, 1.55, 0), // duct across
          new THREE.Vector3(-2.4, 1.35, 0), // supply vent
          new THREE.Vector3(-3.4, 0.4, 0), // back into room
        ],
        true
      ),
    []
  );

  const tube = useMemo(() => new THREE.TubeGeometry(curve, 140, 0.045, 8, true), [curve]);

  const count = 260;
  const points = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const coilRef = useRef<THREE.MeshStandardMaterial>(null);
  const positions = useMemo(() => new Float32Array(count * 3), []);
  const offsets = useMemo(
    () => Float32Array.from({ length: count }, () => Math.random()),
    []
  );
  const jitter = useMemo(
    () => Float32Array.from({ length: count * 2 }, () => (Math.random() - 0.5) * 0.14),
    []
  );

  const target = useMemo(() => new THREE.Color(MODE_COLOR.cooling), []);

  useFrame(({ clock }, dt) => {
    const speed = mode === "filtration" ? 0.035 : 0.055;
    const t = clock.elapsedTime * speed;
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const p = (offsets[i] + t) % 1;
      curve.getPointAt(p, v);
      positions[i * 3] = v.x + jitter[i * 2];
      positions[i * 3 + 1] = v.y + jitter[i * 2 + 1];
      positions[i * 3 + 2] = v.z + Math.sin(p * 40 + i) * 0.05;
    }
    if (points.current)
      (points.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    target.set(MODE_COLOR[mode]);
    if (matRef.current) matRef.current.color.lerp(target, Math.min(1, dt * 4));
    if (coilRef.current) {
      coilRef.current.emissive.lerp(target, Math.min(1, dt * 4));
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 6, 4]} intensity={1.1} />
      <pointLight position={[-4, 2, 3]} intensity={7} color="#fccd35" distance={13} />

      {/* the loop itself, ghosted */}
      <mesh geometry={tube}>
        <meshStandardMaterial color="#2c3648" transparent opacity={0.35} roughness={0.8} />
      </mesh>

      {/* room block */}
      <mesh position={[-3.4, 0.35, -0.3]}>
        <boxGeometry args={[1.3, 2.3, 0.16]} />
        <meshStandardMaterial color="#39435a" roughness={0.85} />
      </mesh>

      {/* filter frame */}
      <mesh position={[-1.2, -1.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#9fd7a0" roughness={0.7} />
      </mesh>

      {/* air handler */}
      <mesh position={[0.2, -1.0, 0]}>
        <boxGeometry args={[0.75, 0.75, 0.6]} />
        <meshStandardMaterial color="#1b2230" metalness={0.55} roughness={0.4} />
      </mesh>

      {/* coil — glows with the active mode */}
      <mesh position={[1.15, 0.0, 0]} rotation={[0, 0, Math.PI / 8]}>
        <boxGeometry args={[0.14, 0.9, 0.5]} />
        <meshStandardMaterial
          ref={coilRef}
          color="#5a6478"
          emissive="#7cc4ff"
          emissiveIntensity={0.7}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* supply vent */}
      <mesh position={[-2.4, 1.35, 0]}>
        <boxGeometry args={[0.55, 0.16, 0.4]} />
        <meshStandardMaterial color="#8a93a5" metalness={0.6} roughness={0.35} />
      </mesh>

      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={matRef}
          color={MODE_COLOR.cooling}
          size={0.07}
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
