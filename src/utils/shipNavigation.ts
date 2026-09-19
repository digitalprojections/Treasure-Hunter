/** Project the direction to an offscreen ship onto the inset viewport edge. */
export function shipNavigation(x: number, y: number, width: number, height: number) {
  if (width <= 0 || height <= 0 || (x >= 0 && x <= width && y >= 0 && y <= height)) return null;
  const dx = x - width / 2, dy = y - height / 2;
  const inset = Math.min(28, width / 4, height / 4);
  const scale = Math.min((width / 2 - inset) / Math.abs(dx), (height / 2 - inset) / Math.abs(dy));
  return { x: width / 2 + dx * scale, y: height / 2 + dy * scale, angle: Math.atan2(dy, dx) * 180 / Math.PI };
}
