import type { Vector3 } from "../types";

export const labTolch = ([l, a, b]: Vector3): Vector3 => {
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  return [l, Math.sqrt(a ** 2 + b ** 2), hue >= 0 ? hue : hue + 360];
};
export const lchToLab = ([l, c, h]: Vector3): Vector3 => {
  return [
    l,
    c * Math.cos((h * Math.PI) / 180),
    c * Math.sin((h * Math.PI) / 180),
  ];
};
