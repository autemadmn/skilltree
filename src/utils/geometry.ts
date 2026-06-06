import * as THREE from "three";
import type { OrbConnection, OrbNode, Vector3Tuple } from "../types/models";

export function tupleToVector(position: Vector3Tuple) {
  return new THREE.Vector3(position[0], position[1], position[2]);
}

export function createConnectionCurve(source: Vector3Tuple, target: Vector3Tuple, liftBias = 1) {
  const start = tupleToVector(source);
  const end = tupleToVector(target);
  const delta = new THREE.Vector3().subVectors(end, start);
  const distance = Math.max(delta.length(), 0.001);
  const side = new THREE.Vector3(-delta.z, delta.y * 0.25 + 0.8, delta.x).normalize();
  const lift = Math.min(7, Math.max(1.8, distance * 0.22)) * liftBias;
  const controlA = start.clone().lerp(end, 0.34).add(side.clone().multiplyScalar(lift));
  const controlB = start
    .clone()
    .lerp(end, 0.66)
    .add(side.clone().multiplyScalar(lift * 0.72))
    .add(new THREE.Vector3(0, lift * 0.15, 0));

  return new THREE.CatmullRomCurve3([start, controlA, controlB, end], false, "catmullrom", 0.45);
}

export function getActiveOrbIds(
  activeId: string | null,
  orbs: Record<string, OrbNode>,
  connections: OrbConnection[],
  highlightedIds: string[]
) {
  const active = new Set<string>(highlightedIds);
  if (!activeId || !orbs[activeId]) {
    return active;
  }

  active.add(activeId);
  const node = orbs[activeId];
  if (node.parentId) active.add(node.parentId);
  node.childrenIds.forEach((id) => active.add(id));
  node.relatedIds.forEach((id) => active.add(id));
  connections.forEach((connection) => {
    if (connection.sourceId === activeId) active.add(connection.targetId);
    if (connection.targetId === activeId) active.add(connection.sourceId);
  });
  return active;
}

export function generateMainSectionPosition(index: number, total: number): Vector3Tuple {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const radius = 15 + (index % 3) * 1.8;
  return [
    Math.cos(angle) * radius,
    Math.sin(angle * 1.3) * 4.5 + (index % 2 ? 2.4 : -1.8),
    Math.sin(angle) * radius + Math.cos(index * 0.9) * 4
  ];
}

export function generateChildPosition(
  parent: OrbNode,
  siblingIndex: number,
  siblingCount: number,
  isDeepNode = false
): Vector3Tuple {
  const parentVector = tupleToVector(parent.position);
  const angle = (siblingIndex / Math.max(siblingCount, 1)) * Math.PI * 2 + siblingIndex * 0.33;
  const radius = isDeepNode ? 3.1 + (siblingIndex % 3) * 0.7 : 4.6 + (siblingIndex % 4) * 0.55;
  const outward = parentVector.clone().normalize();
  if (outward.length() < 0.2) outward.set(1, 0, 0);
  const tangent = new THREE.Vector3(-outward.z, 0.35, outward.x).normalize();
  const bitangent = new THREE.Vector3().crossVectors(outward, tangent).normalize();
  const offset = outward
    .multiplyScalar(isDeepNode ? radius * 0.9 : radius * 0.55)
    .add(tangent.multiplyScalar(Math.cos(angle) * radius))
    .add(bitangent.multiplyScalar(Math.sin(angle) * radius * 0.76));

  return [
    parentVector.x + offset.x,
    parentVector.y + offset.y + Math.sin(angle * 1.7) * 1.1,
    parentVector.z + offset.z
  ];
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
