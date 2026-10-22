import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { computeFocus } from "../utils/focus.js";

const MODEL_PATHS = [
  "/models/cocktail.glb",
  "/models/cocktail_from_mouthwashing.glb",
  "/models/cocktail_pineaple_1.2.glb",
  "/models/creamed_coffee.glb",
  "/models/cute_milkshake.glb",
  "/models/malibu_sunset.glb",
];

const MODEL_ROTATIONS = {};

const TARGET_HEIGHT = 1.6;

const GLOW_COLORS = ["#e84b35", "#ffc857", "#721849"];

const FOCUS_HEIGHT_RATIO = 0.6;

const tmpTarget = new THREE.Vector3();

MODEL_PATHS.forEach((path) => useGLTF.preload(path));

let glowTexture = null;
function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.35)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(canvas);
  return glowTexture;
}

export default function DrinkModel({
  modelIndex,
  position,
  hovered = false,
  selected = false,
  dimmed = false,
  focus = null,
  onClick,
  onPointerOver,
  onPointerOut,
}) {
  const modelPath = MODEL_PATHS[modelIndex % MODEL_PATHS.length];
  const glowColor = GLOW_COLORS[modelIndex % GLOW_COLORS.length];
  const { scene } = useGLTF(modelPath);
  const glowRef = useRef();
  const modelRef = useRef();
  const groupRef = useRef();
  const [initialPosition] = useState(position);

  const model = useMemo(() => {
    const clone = scene.clone();
    const wrapper = new THREE.Group();
    const [rx, ry, rz] = MODEL_ROTATIONS[modelPath] || [0, 0, 0];
    clone.rotation.set(rx, ry, rz);
    wrapper.add(clone);

    const box = new THREE.Box3().setFromObject(wrapper);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const factor = TARGET_HEIGHT / size.y;

    clone.position.set(-center.x, -box.min.y, -center.z);
    wrapper.scale.setScalar(factor);

    const root = new THREE.Group();
    root.add(wrapper);
    return root;
  }, [scene, modelPath]);

  useFrame((state, delta) => {
    const object = modelRef.current;
    const group = groupRef.current;
    if (!object || !group) return;

    const t = 1 - Math.exp(-delta * 12);
    const tMove = 1 - Math.exp(-delta * 7);

    let groupScale;
    if (selected && focus) {
      const height = computeFocus(state, { ...focus, heightRatio: FOCUS_HEIGHT_RATIO }, tmpTarget);
      groupScale = height / TARGET_HEIGHT;
    } else {
      tmpTarget.set(position[0], position[1], position[2] - (dimmed ? 1.2 : 0));
      groupScale = dimmed ? 0.85 : 1;
    }
    group.position.lerp(tmpTarget, tMove);
    group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, groupScale, tMove));

    object.rotation.y += delta * (hovered ? 0.9 : 0.25);

    const targetScale = hovered && !selected ? 1.1 : 1;
    object.scale.setScalar(THREE.MathUtils.lerp(object.scale.x, targetScale, t));

    if (glowRef.current) {
      const material = glowRef.current.material;
      const targetOpacity = selected ? 0.7 : hovered ? 0.85 : dimmed ? 0.05 : 0.18;
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, t);
    }
  });

  return (
    <group ref={groupRef} position={initialPosition}>
      <sprite ref={glowRef} position={[0, TARGET_HEIGHT * 0.5, -0.4]} scale={[2.6, 2.6, 1]}>
        <spriteMaterial
          map={getGlowTexture()}
          color={glowColor}
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <primitive
        ref={modelRef}
        object={model}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      />
    </group>
  );
}
