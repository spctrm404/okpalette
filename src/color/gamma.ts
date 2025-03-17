import type { Vector3 } from "../types";

export const applyGamma = (rgb: Vector3): Vector3 => {
  return rgb.map((val) => {
    const sign = val < 0 ? -1 : 1;
    const abs = val * sign;
    if (abs > 0.0031308) return sign * (1.055 * abs ** (1 / 2.4) - 0.055);
    return 12.92 * val;
  }) as Vector3;
};
export const removeGamma = (rgb: Vector3): Vector3 => {
  return rgb.map((val) => {
    const sign = val < 0 ? -1 : 1;
    const abs = val * sign;
    if (abs <= 0.04045) return val / 12.92;
    return sign * ((abs + 0.055) / 1.055) ** 2.4;
  }) as Vector3;
};
