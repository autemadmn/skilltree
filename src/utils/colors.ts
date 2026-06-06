import * as THREE from "three";

export const SECTION_COLORS = {
  core: "#dce7ff",
  philosophy: "#9b5cff",
  biology: "#32e6a1",
  history: "#ffb13d",
  psychology: "#ff4fc4",
  technology: "#42a8ff",
  business: "#36f4f1",
  nutrition: "#a8ff5a",
  literature: "#ff8a35",
  projects: "#ffe7a3",
  random: "#b5ffef"
};

export const COLOR_SWATCHES = [
  "#9b5cff",
  "#32e6a1",
  "#ffb13d",
  "#ff4fc4",
  "#42a8ff",
  "#36f4f1",
  "#a8ff5a",
  "#ff8a35",
  "#ffe7a3",
  "#b5ffef",
  "#f4f7ff",
  "#ef5d60"
];

export function withAlpha(hex: string, alpha: number) {
  const color = new THREE.Color(hex);
  return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(
    color.b * 255
  )}, ${alpha})`;
}

export function blendColors(a: string, b: string, amount = 0.5) {
  const color = new THREE.Color(a);
  color.lerp(new THREE.Color(b), amount);
  return `#${color.getHexString()}`;
}

export function readableAccent(hex: string) {
  const color = new THREE.Color(hex);
  const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  return luminance > 0.7 ? "#08101f" : "#f7fbff";
}
