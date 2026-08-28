"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Interactive cutaway of a complete comfort system. Indoor side (air handler,
 * coil, filter, ducts, thermostat, vents) on the left; outdoor condenser with
 * compressor on the right. Selecting a component eases the camera toward it
 * and highlights it.
 */

export type HvacPartKey =
  | "thermostat"
  | "return"
  | "filter"
  | "handler"
  | "coil"
  | "duct"
  | "supply"
  | "compressor"
  | "condenser";

export const HVAC_PARTS: Record<
  HvacPartKey,
  { name: string; blurb: string; focus: [number, number, number] }
> = {
  thermostat: {
    name: "Thermostat",
    blurb:
      "The control center of your comfort system. It senses indoor temperature and tells the system when to heat, cool, or rest.",
    focus: [-4.1, 1.4, 0.4],
  },
  return: {
    name: "Return Air",
    blurb:
      "Warm indoor air returns to the system where it is filtered and conditioned before being distributed back through your home.",
    focus: [-2.6, -0.7, 0.2],
  },
  filter: {
    name: "Filter",
    blurb:
      "As air enters the system it passes through the filter, which captures dust, pollen, and airborne particles — protecting your air quality and the equipment itself.",
    focus: [-2.05, -0.35, 0.2],
  },
  handler: {
    name: "Air Handler",
    blurb:
      "The indoor unit that houses the blower. It pulls air across the coil and pushes conditioned air through the duct system.",
    focus: [-1.35, 0.25, 0.2],
  },
  coil: {
    name: "Evaporator Coil",
    blurb:
      "Cold refrigerant flowing through the evaporator coil absorbs heat from indoor air, cooling and dehumidifying it in the process.",
    focus: [-1.35, 0.75, 0.2],
  },
  duct: {
    name: "Ductwork",
    blurb:
      "A network of sealed passages that distributes conditioned air evenly to every room. Leaky ducts waste energy — sealed ducts deliver the comfort you paid for.",
    focus: [-0.4, 1.85, 0.2],
  },
  supply: {
    name: "Supply Air",
    blurb:
      "Conditioned air is delivered back into your living spaces through supply vents, keeping every room at the temperature you chose.",
    focus: [-3.5, 2.1, 0.2],
  },
  compressor: {
    name: "Compressor",
    blurb:
      "The heart of the refrigeration cycle. It pressurizes refrigerant so heat collected indoors can be moved and released outside.",
    focus: [2.5, -0.4, 0.4],
  },
  condenser: {
    name: "Condenser",
    blurb:
      "The outdoor coil. Refrigerant releases the heat it absorbed indoors as outside air is drawn across the condenser by the fan.",
    focus: [2.5, 0.6, 0.4],
  },
};

const GOLD = new THREE.Color("#fccd35");
const HIGHLIGHT = new THREE.Color("#fccd35");

function Part({
  id,
  selected,
  onSelect,
  children,
  position,
}: {
  id: HvacPartKey;
  selected: HvacPartKey | null;
  onSelect: (k: HvacPartKey) => void;
  children: React.ReactNode;
  position?: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);
  const isSel = selected === id;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = isSel ? 1 + Math.sin(clock.elapsedTime * 4) * 0.02 : 1;
    ref.current.scale.setScalar(pulse);
  });
  const handle = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect(id);
  };
  return (
    <group
      ref={ref}
      position={position}
      onPointerDown={handle}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      {children}
      {isSel && (
        <mesh>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color={HIGHLIGHT} transparent opacity={0} />
        </mesh>
      )}
    </group>
  );
}

function mat(color: string, sel: boolean, metal = 0.5, rough = 0.4) {
  return (
    <meshStandardMaterial
      color={color}
      metalness={metal}
      roughness={rough}
      emissive={sel ? HIGHLIGHT : new THREE.Color("#000000")}
      emissiveIntensity={sel ? 0.35 : 0}
    />
  );
}

function FlowDots({ selected }: { selected: HvacPartKey | null }) {
  const count = 90;
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-3.6, -0.85, 0.3), // return grille
        new THREE.Vector3(-2.6, -0.8, 0.3),
        new THREE.Vector3(-2.05, -0.5, 0.3), // filter
        new THREE.Vector3(-1.35, 0.1, 0.3), // handler
        new THREE.Vector3(-1.35, 1.1, 0.3), // coil / out top
        new THREE.Vector3(-1.0, 1.85, 0.3), // duct
        new THREE.Vector3(-3.3, 1.85, 0.3),
        new THREE.Vector3(-3.6, 1.55, 0.3), // supply vent drop
      ]),
    []
  );
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => new Float32Array(count * 3), []);
  const offsets = useMemo(
    () => Float32Array.from({ length: count }, () => Math.random()),
    []
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.06;
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const p = (offsets[i] + t) % 1;
      curve.getPointAt(p, v);
      positions[i * 3] = v.x + (Math.random() - 0.5) * 0.05;
      positions[i * 3 + 1] = v.y + (Math.random() - 0.5) * 0.05;
      positions[i * 3 + 2] = v.z;
    }
    if (points.current)
      (points.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });
  const active = selected === null || ["return", "filter", "handler", "coil", "duct", "supply"].includes(selected);
  return (
    <points ref={points} visible={active}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#8fd0ff"
        size={0.055}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Rig({ selected }: { selected: HvacPartKey | null }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.6, 0));
  useFrame((_, dt) => {
    const dest = selected
      ? new THREE.Vector3(...HVAC_PARTS[selected].focus)
      : new THREE.Vector3(0, 0.6, 0);
    const camDest = selected
      ? new THREE.Vector3(dest.x * 0.55, dest.y + 0.7, 5.2)
      : new THREE.Vector3(0, 1.5, 7.2);
    camera.position.lerp(camDest, Math.min(1, dt * 2.4));
    target.current.lerp(dest, Math.min(1, dt * 2.4));
    camera.lookAt(target.current);
  });
  return null;
}

export function HvacExplorerScene({
  selected,
  onSelect,
}: {
  selected: HvacPartKey | null;
  onSelect: (k: HvacPartKey) => void;
}) {
  const fanRef = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (fanRef.current) fanRef.current.rotation.y += dt * 4;
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 7, 5]} intensity={1.2} />
      <pointLight position={[-5, 3, 4]} intensity={8} color="#fccd35" distance={14} />
      <Rig selected={selected} />

      {/* ——— house shell (cutaway) ——— */}
      <group position={[-2.2, 0.5, 0]}>
        {/* floor */}
        <mesh position={[0, -1.15, 0]}>
          <boxGeometry args={[4.4, 0.12, 2.6]} />
          {mat("#2a3242", false, 0.2, 0.8)}
        </mesh>
        {/* left wall */}
        <mesh position={[-2.1, 0.85, 0]}>
          <boxGeometry args={[0.12, 4.1, 2.6]} />
          {mat("#39435a", false, 0.15, 0.85)}
        </mesh>
        {/* attic floor / ceiling line */}
        <mesh position={[0, 1.55, 0]}>
          <boxGeometry args={[4.4, 0.08, 2.6]} />
          {mat("#39435a", false, 0.15, 0.85)}
        </mesh>
        {/* roof */}
        <mesh position={[0, 2.62, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[4.7, 0.1, 2.7]} />
          {mat("#1c2331", false, 0.3, 0.7)}
        </mesh>
      </group>

      {/* thermostat on the wall */}
      <Part id="thermostat" selected={selected} onSelect={onSelect} position={[-4.15, 1.15, 0.4]}>
        <mesh>
          <boxGeometry args={[0.1, 0.42, 0.42]} />
          {mat("#e8e8ea", selected === "thermostat", 0.2, 0.5)}
        </mesh>
        <mesh position={[0.06, 0, 0]}>
          <boxGeometry args={[0.02, 0.22, 0.22]} />
          <meshBasicMaterial color={GOLD} />
        </mesh>
      </Part>

      {/* return grille (floor level) */}
      <Part id="return" selected={selected} onSelect={onSelect} position={[-3.6, -0.95, 0.3]}>
        <mesh>
          <boxGeometry args={[0.55, 0.34, 0.08]} />
          {mat("#8a93a5", selected === "return", 0.6, 0.35)}
        </mesh>
        {[-0.1, 0, 0.1].map((y) => (
          <mesh key={y} position={[0, y, 0.045]}>
            <boxGeometry args={[0.45, 0.03, 0.02]} />
            {mat("#5b6475", selected === "return", 0.6, 0.4)}
          </mesh>
        ))}
      </Part>

      {/* filter slab */}
      <Part id="filter" selected={selected} onSelect={onSelect} position={[-2.05, -0.45, 0.3]}>
        <mesh rotation={[0, 0, Math.PI / 7]}>
          <boxGeometry args={[0.09, 0.75, 0.75]} />
          {mat("#9fd7a0", selected === "filter", 0.1, 0.8)}
        </mesh>
      </Part>

      {/* air handler cabinet */}
      <Part id="handler" selected={selected} onSelect={onSelect} position={[-1.35, 0.15, 0.2]}>
        <mesh>
          <boxGeometry args={[0.85, 1.5, 0.85]} />
          {mat("#39435a", selected === "handler", 0.6, 0.35)}
        </mesh>
        <mesh ref={fanRef} position={[0, -0.35, 0]}>
          <torusGeometry args={[0.22, 0.05, 8, 20]} />
          {mat("#fccd35", selected === "handler", 0.6, 0.3)}
        </mesh>
      </Part>

      {/* evaporator coil (A-coil) */}
      <Part id="coil" selected={selected} onSelect={onSelect} position={[-1.35, 1.05, 0.2]}>
        <mesh rotation={[0, 0, Math.PI / 5]} position={[-0.16, 0, 0]}>
          <boxGeometry args={[0.08, 0.62, 0.6]} />
          {mat("#7cc4ff", selected === "coil", 0.7, 0.25)}
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 5]} position={[0.16, 0, 0]}>
          <boxGeometry args={[0.08, 0.62, 0.6]} />
          {mat("#7cc4ff", selected === "coil", 0.7, 0.25)}
        </mesh>
      </Part>

      {/* duct run across the attic */}
      <Part id="duct" selected={selected} onSelect={onSelect} position={[-2.2, 1.9, 0.2]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 2.6, 20]} />
          {mat("#aeb6c4", selected === "duct", 0.75, 0.3)}
        </mesh>
        <mesh position={[0.85, -0.35, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.7, 16]} />
          {mat("#aeb6c4", selected === "duct", 0.75, 0.3)}
        </mesh>
      </Part>

      {/* supply vent */}
      <Part id="supply" selected={selected} onSelect={onSelect} position={[-3.55, 1.62, 0.3]}>
        <mesh>
          <boxGeometry args={[0.5, 0.12, 0.34]} />
          {mat("#8a93a5", selected === "supply", 0.6, 0.35)}
        </mesh>
      </Part>

      {/* ——— outdoor unit ——— */}
      <group position={[2.5, 0, 0]}>
        <Part id="condenser" selected={selected} onSelect={onSelect} position={[0, 0.15, 0]}>
          <mesh>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            {mat("#1b2230", selected === "condenser", 0.55, 0.4)}
          </mesh>
          <mesh position={[0, 0.79, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.55, 0.66, 40]} />
            <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
        </Part>
        <Part id="compressor" selected={selected} onSelect={onSelect} position={[0, -0.35, 0.45]}>
          <mesh>
            <cylinderGeometry args={[0.26, 0.3, 0.62, 20]} />
            {mat("#0d1118", selected === "compressor", 0.8, 0.25)}
          </mesh>
        </Part>
        {/* pad */}
        <mesh position={[0, -0.72, 0]}>
          <boxGeometry args={[1.8, 0.12, 1.8]} />
          {mat("#2a3242", false, 0.2, 0.8)}
        </mesh>
      </group>

      {/* refrigerant lineset connecting indoor & outdoor */}
      <mesh position={[0.55, -0.35, 0.25]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.045, 2.6, 10]} />
        <meshStandardMaterial color="#c9a14a" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.55, -0.5, 0.25]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 2.6, 10]} />
        <meshStandardMaterial color="#c9a14a" metalness={0.85} roughness={0.25} />
      </mesh>

      <FlowDots selected={selected} />
    </>
  );
}
