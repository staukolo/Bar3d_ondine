import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { computeFocus, getFocusHeightPx } from "../utils/focus.js";
import { getRecipeLayers } from "../utils/recipe.js";

const RADIUS = 0.2;
const BASE = 0.04;
const LIQUID_HEIGHT = 0.86;
const LABEL_HEIGHT_PX = 34;

const HEIGHT_RATIO = 0.45;

const FILL_DELAY = 0.45;
const FILL_DURATION = 2.2;

const GRADUATIONS = [0.25, 0.5, 0.75];

const tmpTarget = new THREE.Vector3();

export default function RecipeGlass({ drink, focus }) {
  const groupRef = useRef();
  const layerRefs = useRef([]);
  const elapsed = useRef(0);
  const placed = useRef(false);

  const { layers, total } = useMemo(() => getRecipeLayers(drink), [drink]);
  const size = useThree((state) => state.size);
  const labelGap = LABEL_HEIGHT_PX / getFocusHeightPx(size, focus, HEIGHT_RATIO);

  const stack = useMemo(() => {
    const items = [];
    for (const layer of layers) {
      const previous = items[items.length - 1];
      const start = previous ? previous.start + previous.height : BASE;
      const height = layer.share * LIQUID_HEIGHT;
      const labelY = Math.max(start + height / 2, previous ? previous.labelY + labelGap : -Infinity);
      items.push({ ...layer, start, height, labelY });
    }
    return items;
  }, [layers, labelGap]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const height = computeFocus(state, { ...focus, heightRatio: HEIGHT_RATIO }, tmpTarget);
    if (!placed.current) {
      group.position.copy(tmpTarget);
      placed.current = true;
    } else {
      group.position.lerp(tmpTarget, 1 - Math.exp(-delta * 10));
    }
    group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, height, 1 - Math.exp(-delta * 8)));
    group.rotation.y = Math.atan2(
      state.camera.position.x - group.position.x,
      state.camera.position.z - group.position.z
    );

    elapsed.current += delta;
    const progress = THREE.MathUtils.clamp((elapsed.current - FILL_DELAY) / FILL_DURATION, 0, 1);
    const level = BASE + progress * LIQUID_HEIGHT;

    stack.forEach((layer, i) => {
      const mesh = layerRefs.current[i];
      if (!mesh) return;
      const visible = THREE.MathUtils.clamp(level - layer.start, 0, layer.height);
      mesh.visible = visible > 0.0005;
      mesh.scale.y = Math.max(visible, 0.0001);
      mesh.position.y = layer.start + visible / 2;
    });
  });

  return (
    <group ref={groupRef} scale={0.001}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[RADIUS + 0.025, RADIUS + 0.01, 1, 48, 1, true]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.14}
          roughness={0.1}
          metalness={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, BASE / 2, 0]}>
        <cylinderGeometry args={[RADIUS + 0.01, RADIUS + 0.03, BASE, 48]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RADIUS + 0.025, 0.006, 8, 64]} />
        <meshBasicMaterial color="#ffc857" toneMapped={false} />
      </mesh>

      {GRADUATIONS.map((g) => (
        <mesh key={g} position={[0, BASE + g * LIQUID_HEIGHT, RADIUS + 0.03]}>
          <boxGeometry args={[0.07, 0.005, 0.002]} />
          <meshBasicMaterial color="#ffc857" toneMapped={false} transparent opacity={0.7} />
        </mesh>
      ))}

      {stack.map((layer, i) => (
        <mesh key={i} ref={(el) => (layerRefs.current[i] = el)} visible={false}>
          <cylinderGeometry args={[RADIUS, RADIUS - 0.01, 1, 48]} />
          <meshStandardMaterial
            color={layer.color}
            roughness={0.35}
            transparent
            opacity={0.93}
            emissive={layer.color}
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}

      <Html position={[0, 1.08, 0]} center zIndexRange={[1, 0]} style={{ pointerEvents: "none" }}>
        <div className="recipe-title">La recette en couches</div>
      </Html>
      <Html position={[0, -0.07, 0]} center zIndexRange={[1, 0]} style={{ pointerEvents: "none" }}>
        <div className="recipe-total">
          Total {stack.some((l) => l.estimated) ? "≈ " : ""}
          {Math.round(total)} cl
        </div>
      </Html>

      {stack.map((layer, i) => {
        const appearAt =
          FILL_DELAY + ((layer.start + layer.height - BASE) / LIQUID_HEIGHT) * FILL_DURATION;
        return (
          <Html
            key={i}
            position={[RADIUS + 0.1, layer.labelY, 0]}
            zIndexRange={[1, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div className="layer-label" style={{ animationDelay: `${appearAt}s` }}>
              <span className="layer-swatch" style={{ background: layer.color }} />
              <span className="layer-name">{layer.label}</span>
              <span className="layer-dose">
                {layer.measure || `≈ ${Math.round(layer.cl)} cl`}
              </span>
              <span className="layer-share">
                {layer.estimated ? "≈ " : ""}
                {Math.max(1, Math.round(layer.share * 100))} %
              </span>
            </div>
          </Html>
        );
      })}
    </group>
  );
}
