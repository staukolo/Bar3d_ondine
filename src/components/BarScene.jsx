import { useEffect, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import DrinkModel from "./DrinkModel.jsx";
import RecipeGlass from "./RecipeGlass.jsx";

const SPACING = 1.9;
const PANEL_WIDTH = 420;
const SHEET_HEIGHT_RATIO = 0.55;
const NARROW_FREE_WIDTH = 800;

function getFocusLayout(layout, size) {
  if (layout === "full") return null;
  const shiftX = layout === "side" ? PANEL_WIDTH / size.width : 0;
  const shiftY =
    layout === "sheet" ? Math.min(0.8, (window.innerHeight * SHEET_HEIGHT_RATIO) / size.height) : 0;
  const narrow = size.width * (1 - shiftX) < NARROW_FREE_WIDTH;
  return {
    drink: { shiftX, shiftY, side: narrow ? -0.27 : -0.2 },
    recipe: { shiftX, shiftY, side: narrow ? -0.02 : 0.1 },
  };
}
const CAMERA_TARGET = [0, 0.7, 0];

function CameraRig({ perPage }) {
  const { camera, size, controls } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    const margin = perPage <= 3 ? 2.4 : 4;
    const neededWidth = (perPage - 1) * SPACING + margin;
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const distance = Math.max(7, neededWidth / (2 * Math.tan(halfFov) * aspect));

    camera.position.set(0, CAMERA_TARGET[1] + distance * 0.22, distance);
    camera.updateProjectionMatrix();
    controls?.update();
  }, [camera, size, controls, perPage]);

  return null;
}

function Platform({ width }) {
  const radius = Math.max(width / 2 + 1, 2.6);
  return (
    <group position={[0, -0.08, 0]} scale={[1, 1, 0.32]}>
      <mesh>
        <cylinderGeometry args={[radius, radius, 0.12, 96]} />
        <meshStandardMaterial
          color="#321039"
          emissive="#721849"
          emissiveIntensity={0.35}
          metalness={0.7}
          roughness={0.25}
          transparent
          opacity={0.7}
        />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.025, 8, 160]} />
        <meshBasicMaterial color="#e84b35" toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function BarScene({
  drinks,
  modelIndexById,
  perPage,
  layout,
  selectedId,
  onSelectDrink,
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const { size } = useThree();
  const focusLayout = getFocusLayout(layout, size);
  const selectedDrink = drinks.find((d) => d.idDrink === selectedId);
  const rowWidth = (Math.max(drinks.length, 1) - 1) * SPACING;

  const getPosition = (index) => {
    const x = (index - (drinks.length - 1) / 2) * SPACING;
    const z = -x * x * 0.03;
    return [x, 0, z];
  };

  return (
    <>
      <CameraRig perPage={perPage} />
      <OrbitControls
        makeDefault
        target={CAMERA_TARGET}
        enablePan={false}
        minDistance={4}
        maxDistance={26}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.05}
        minAzimuthAngle={-Math.PI / 5}
        maxAzimuthAngle={Math.PI / 5}
      />

      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <pointLight position={[-6, 3, 2]} intensity={30} color="#721849" />
      <pointLight position={[6, 2, 3]} intensity={30} color="#e84b35" />

      <Platform width={rowWidth} />

      {drinks.map((drink, index) => {
        const position = getPosition(index);
        const hovered = hoveredId === drink.idDrink;
        const selected = selectedId === drink.idDrink;
        return (
          <group key={drink.idDrink}>
            <DrinkModel
              modelIndex={modelIndexById[drink.idDrink] ?? 0}
              position={position}
              hovered={hovered}
              selected={selected}
              dimmed={Boolean(selectedId) && !selected}
              focus={focusLayout?.drink}
              onClick={(e) => {
                e.stopPropagation();
                onSelectDrink(drink);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredId(drink.idDrink);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHoveredId(null);
                document.body.style.cursor = "default";
              }}
            />
            <Html
              position={[position[0], -0.3, position[2] + 0.5]}
              center
              zIndexRange={[1, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div className={`glass-label ${selectedId ? "is-hidden" : ""} ${hovered ? "is-hovered" : ""}`}>
                {drink.strDrink}
              </div>
            </Html>
          </group>
        );
      })}

      {selectedDrink && focusLayout && (
        <RecipeGlass
          key={selectedDrink.idDrink}
          drink={selectedDrink}
          focus={focusLayout.recipe}
        />
      )}
    </>
  );
}
