"use client";

import { Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const DEG = Math.PI / 180;

type Axis = "x" | "y" | "z";

interface ArmLink {
  url: string;
  offset: [number, number, number];
  axis: Axis;
  label: string;
}

// Rantai link base → flange. Offset dalam mm, terukur dari pusat cincin flange.
const ARM_LINKS: ArmLink[] = [
  { url: "/models/dobot/1.glb", offset: [0, 0, 0],        axis: "y", label: "Base (diam)" },
  { url: "/models/dobot/2.glb", offset: [0, 136.5, 0],    axis: "y", label: "J1 base yaw" },
  { url: "/models/dobot/3.glb", offset: [0, 97.4, 44.5],  axis: "z", label: "J2 bahu" },
  { url: "/models/dobot/4.glb", offset: [0, 399.8, 13.0], axis: "z", label: "J3 siku" },
  { url: "/models/dobot/5.glb", offset: [0, 330.0, -2.0], axis: "z", label: "J4 wrist pitch" },
  { url: "/models/dobot/6.glb", offset: [0, 64.0, 71.2],  axis: "y", label: "J5 wrist yaw" },
  { url: "/models/dobot/7.glb", offset: [0, 56.0, 57.5],  axis: "z", label: "J6 flange roll" },
];

// Kamera DSLR di flange. Alas kamera menempel di muka flange (Z=36),
// arah bidik = -X link 7. Rotasi -90° di Z adalah satu-satunya yang memenuhi.
const CAMERA_MODEL = {
  url: "/models/dobot/cam.glb",
  rotation: [0, 0, -Math.PI / 2] as [number, number, number],
  position: [10, -15, 36] as [number, number, number],
};

// Sudut asli robot, dari new_preset.json. Index 0 = base (selalu 0).
const REST_POSE: number[] = [0, 71.627, -4.2947, 4.2431, 8.6527, -102.0457, 118.9324];

const PRESET_POSES: number[][] = [
  [0, -181.6155, 41.3417, -128.3843, 176.698, 90.3299, 95.22],       // 1  P1
  [0, -181.6155, 1.4617, -0.4355, 73.8388, 90.3299, 95.22],          // 2  P2
  [0, -95.9355, 67.5787, -4.5434, 29.3368, 92.3044, 35.6745],        // 3  P21
  [0, -95.9355, -67.5285, -4.5434, -15.5512, -92.4524, 155.4905],    // 4  P14
  [0, -180.2091, -35.7045, -4.5434, -66.9848, -92.4524, 270.1817],   // 5  P15
  [0, -180.2091, -134.7093, -3.065, 75.012, -92.4524, 270.0633],     // 6  P16
  [0, -92.5243, -114.5797, -54.6442, 75.012, -107.8716, 155.5433],   // 7  P17
  [0, -242.1883, -123.1717, -55.1722, 92.82, -82.1084, -12.1927],    // 8  P18
  [0, -359.0795, -65.3797, 50.591, -67.3144, -90.6972, 91.9193],     // 9  P10
  [0, -4.6187, 78.0587, -14.5018, -148.8184, -87.1772, 91.9193],     // 10 P11
];

// Aset dalam mm, jangkauan ~1,1 m → dibagi supaya tinggi arm ~1 unit world.
const ARM_SCALE = 1 / 1100;

// Sudut hadap scene. SATU nilai untuk semua pose — sengaja, karena memutar
// scene per pose membuat seluruh robot ikut berputar tiap ganti preset dan
// hasilnya justru kacau. Nilai ini kompromi terbaik untuk kesepuluh pose.
const SCENE_YAW = 105.9;

// ---- FRAMING TETAP ----
// Robot DIAM di satu tempat: tidak digeser-geser tiap ganti preset, supaya
// mata punya patokan tetap dan pergantian pose terasa tenang.
//
// Nilai ini titik tengah rentang vertikal SELURUH pose (-315 mm pada preset 8
// sampai +1073 mm pada pose home, tengahnya 379 mm), jadi pose yang menjulang
// maupun yang menunduk sama-sama muat tanpa perlu digeser.
const FIXED_Y = -0.345;

const POSE_LERP_SPEED = 3.2;

function LinkNode({
  index,
  angles,
  children,
}: {
  index: number;
  angles: React.RefObject<number[]>;
  children?: ReactNode;
}) {
  const link = ARM_LINKS[index];
  const { scene } = useGLTF(link.url, false, true);
  const model = useMemo(() => scene.clone(true), [scene]);
  const joint = useRef<THREE.Group>(null);

  useFrame(() => {
    const g = joint.current;
    if (!g) return;
    const a = angles.current?.[index] ?? 0;
    if (link.axis === "x") g.rotation.x = a;
    else if (link.axis === "y") g.rotation.y = a;
    else g.rotation.z = a;
  });

  return (
    <group position={link.offset}>
      <group ref={joint}>
        <primitive object={model} />
        {children}
      </group>
    </group>
  );
}

function buildChain(i: number, angles: React.RefObject<number[]>, tip: ReactNode): ReactNode {
  if (i >= ARM_LINKS.length) return tip;
  return (
    <LinkNode index={i} angles={angles}>
      {buildChain(i + 1, angles, tip)}
    </LinkNode>
  );
}

function CameraHead() {
  const { scene } = useGLTF(CAMERA_MODEL.url, false, true);
  const model = useMemo(() => scene.clone(true), [scene]);
  return (
    <primitive object={model} rotation={CAMERA_MODEL.rotation} position={CAMERA_MODEL.position} />
  );
}

function ArmRig({ pose, tip }: { pose: number[]; tip: ReactNode }) {
  const angles = useRef<number[]>(pose.map((d) => d * DEG));
  const target = useRef<number[]>(pose.map((d) => d * DEG));

  useEffect(() => {
    target.current = pose.map((d) => d * DEG);
  }, [pose]);

  useFrame((_, delta) => {
    const t = Math.min(1, delta * POSE_LERP_SPEED);
    for (let i = 0; i < angles.current.length; i++) {
      const to = target.current[i] ?? 0;
      angles.current[i] += (to - angles.current[i]) * t;
    }
  });

  return (
    <group scale={ARM_SCALE} position={[0, FIXED_Y, 0]} rotation={[0, SCENE_YAW * DEG, 0]}>
      {buildChain(0, angles, tip)}
    </group>
  );
}

// Cahaya lokal, bukan <Environment> drei — HDR-nya unduh dari CDN,
// sedangkan kiosk harus tetap jalan tanpa internet.
function Lights() {
  return (
    <>
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#dbe2ef", "#112d4e", 1.1]} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} />
      <directionalLight position={[-4, 2, -3]} intensity={1.1} color="#3f72af" />
      <pointLight position={[0, 1.2, 2.5]} intensity={2} color="#dbe2ef" />
    </>
  );
}

// Jarak kamera default.
// Arm melebar sampai ~2 unit (kiri-kanan ±1100mm) dan setinggi ~1,35 unit.
// Di panel PERSEGI dengan fov 40°, lebar yang terlihat = jarak x 0,73.
// Sebaran TCP asli: X -588..558, Y -783..796 → lebar efektif ~1,8 unit.
// Butuh jarak >= 1,8 / 0,73 = 2,47. Dipakai 2,6 supaya robot sebesar mungkin
// tapi pose menyamping/menunduk tetap masuk frame.
// Dengan pemusatan per-pose, tiap pose cuma setinggi <=1 unit (bukan 1,35
// unit rentang penuh), jadi kamera bisa lebih dekat -> robot lebih besar.
const DEFAULT_CAM: [number, number, number] = [0.30, 0.30, 2.30];

export default function DobotViewer({
  preset,
  showCamera = true,
  cameraPosition = DEFAULT_CAM,
  zoom = 1,
  className,
}: {
  /** Nomor preset 1-10. Di luar itu → pose home. */
  preset?: number | null;
  showCamera?: boolean;
  cameraPosition?: [number, number, number];
  /** <1 = mundur (robot lebih kecil), >1 = maju (lebih besar). */
  zoom?: number;
  className?: string;
}) {
  const camPos = useMemo<[number, number, number]>(
    () => [cameraPosition[0] / zoom, cameraPosition[1] / zoom, cameraPosition[2] / zoom],
    [cameraPosition, zoom]
  );
  const idx = preset != null && preset >= 1 && preset <= 10 ? preset : 0;
  const activePose = useMemo(
    () => (idx === 0 ? REST_POSE : PRESET_POSES[idx - 1] ?? REST_POSE),
    [idx]
  );

  return (
    <div className={className ?? "w-full h-full"}>
      <Canvas
        camera={{ position: camPos, fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Lights />
        <Suspense fallback={null}>
          <ArmRig pose={activePose} tip={showCamera ? <CameraHead /> : null} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Prefetch semua aset supaya ganti preset tidak memunculkan pop-in.
ARM_LINKS.forEach((l) => useGLTF.preload(l.url, false, true));
useGLTF.preload(CAMERA_MODEL.url, false, true);