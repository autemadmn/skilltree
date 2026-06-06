import * as THREE from "three";

type OrbGlowProps = {
  color: string;
  radius: number;
  intensity?: number;
  selected?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
};

export function OrbGlow({ color, radius, intensity = 1, selected, highlighted, dimmed }: OrbGlowProps) {
  const opacity = dimmed ? 0.075 : selected || highlighted ? 0.36 : 0.18;
  const lightIntensity = dimmed ? 0.2 : selected || highlighted ? 1.8 : 0;

  return (
    <>
      <mesh scale={selected || highlighted ? 1.42 : 1.24}>
        <sphereGeometry args={[radius * 1.45, 24, 18]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={selected ? 1.82 : 1.55}>
        <sphereGeometry args={[radius * 1.55, 18, 14]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={(selected || highlighted ? 0.12 : 0.055) * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {lightIntensity > 0 && <pointLight color={color} intensity={lightIntensity * intensity} distance={radius * 7} />}
      {(selected || highlighted) && (
        <group>
          <mesh rotation={[Math.PI / 2.2, 0, 0]}>
            <torusGeometry args={[radius * 1.58, radius * 0.018, 8, 64]} />
            <meshBasicMaterial color={color} transparent opacity={0.86} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh rotation={[0.55, 0.25, Math.PI / 2]}>
            <torusGeometry args={[radius * 1.92, radius * 0.012, 8, 64]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.42} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      )}
    </>
  );
}
