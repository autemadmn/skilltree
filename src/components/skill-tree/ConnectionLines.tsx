import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import { blendColors } from "../../utils/colors";
import { createConnectionCurve } from "../../utils/geometry";
import type { OrbConnection } from "../../types/models";

type ConnectionLinesProps = {
  activeIds: Set<string>;
  dimInactive: boolean;
};

function CurveTube({ connection, activeIds, dimInactive }: { connection: OrbConnection; activeIds: Set<string>; dimInactive: boolean }) {
  const orbs = useKnowledgeStore((state) => state.orbs);
  const reducedMotion = useKnowledgeStore((state) => state.settings.reducedMotion);
  const source = orbs[connection.sourceId];
  const target = orbs[connection.targetId];
  const pulseRef = useRef<THREE.Mesh>(null);

  const { geometry, curve, color, active, opacity } = useMemo(() => {
    if (!source || !target) {
      const emptyCurve = createConnectionCurve([0, 0, 0], [0, 0, 0]);
      return {
        geometry: new THREE.TubeGeometry(emptyCurve, 2, 0.001, 3, false),
        curve: emptyCurve,
        color: "#ffffff",
        active: false,
        opacity: 0
      };
    }
    const isActive = activeIds.has(source.id) && activeIds.has(target.id);
    const relationshipBoost = connection.type === "parent-child" ? 1 : 0.58;
    const curveShape = createConnectionCurve(source.position, target.position, connection.type === "related" ? 0.78 : 1);
    const radius = connection.type === "parent-child" ? (isActive ? 0.035 : 0.023) : isActive ? 0.018 : 0.009;
    return {
      geometry: new THREE.TubeGeometry(curveShape, 28, radius, 5, false),
      curve: curveShape,
      color: connection.color || blendColors(source.color, target.color, 0.5),
      active: isActive,
      opacity: dimInactive && !isActive ? 0.08 * relationshipBoost : (isActive ? 0.82 : 0.28) * relationshipBoost
    };
  }, [activeIds, connection, dimInactive, source, target]);

  useFrame(({ clock }) => {
    if (reducedMotion || !pulseRef.current || !curve) return;
    const t = (clock.getElapsedTime() * (connection.type === "related" ? 0.18 : 0.11) + connection.id.length * 0.013) % 1;
    pulseRef.current.position.copy(curve.getPointAt(t));
  });

  if (!source || !target) return null;

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {active && !reducedMotion && (
        <mesh ref={pulseRef}>
          <sphereGeometry args={[connection.type === "parent-child" ? 0.07 : 0.045, 8, 8]} />
          <meshBasicMaterial
            color={active ? "#ffffff" : color}
            transparent
            opacity={active ? 0.82 : 0.24}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

export function ConnectionLines({ activeIds, dimInactive }: ConnectionLinesProps) {
  const connections = useKnowledgeStore((state) => state.connections);

  return (
    <group>
      {connections.map((connection) => (
        <CurveTube key={connection.id} connection={connection} activeIds={activeIds} dimInactive={dimInactive} />
      ))}
    </group>
  );
}
