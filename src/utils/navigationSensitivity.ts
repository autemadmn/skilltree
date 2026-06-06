export const DEFAULT_NAVIGATION_SENSITIVITY = 50;

export function sensitivityToMultiplier(value: number | undefined) {
  const safeValue = Number.isFinite(value) ? value ?? DEFAULT_NAVIGATION_SENSITIVITY : DEFAULT_NAVIGATION_SENSITIVITY;
  const clamped = Math.min(100, Math.max(0, safeValue));

  if (clamped <= DEFAULT_NAVIGATION_SENSITIVITY) {
    return 0.25 + (clamped / DEFAULT_NAVIGATION_SENSITIVITY) * 0.75;
  }

  return 1 + ((clamped - DEFAULT_NAVIGATION_SENSITIVITY) / DEFAULT_NAVIGATION_SENSITIVITY) * 1.5;
}

export function formatSensitivity(value: number | undefined) {
  return `${sensitivityToMultiplier(value).toFixed(2)}x`;
}
