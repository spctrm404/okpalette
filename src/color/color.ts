import type { Vector3 } from "../types";
import { oklabToXYZ, XYZToOkLab } from "./oklab";
import { linearSrgbToXYZ, XYZToLinearSrgb } from "./srgb";
import { linearDisplayP3ToXYZ, XYZToLinearDisplayP3 } from "./displayp3";

export const oklabToLinearSrgb = (lab: Vector3): Vector3 => {
  const xyz = oklabToXYZ(lab);
  return XYZToLinearSrgb(xyz);
};
export const linearSrgbToOklab = (rgb: Vector3): Vector3 => {
  const xyz = linearSrgbToXYZ(rgb);
  return XYZToOkLab(xyz);
};

export const oklabToLinearDisplayP3 = (lab: Vector3): Vector3 => {
  const xyz = oklabToXYZ(lab);
  return XYZToLinearDisplayP3(xyz);
};
export const linearDisplayP3ToOklab = (rgb: Vector3): Vector3 => {
  const xyz = linearDisplayP3ToXYZ(rgb);
  return XYZToOkLab(xyz);
};

export const inGamut = ([r, g, b]: Vector3): boolean => {
  return Math.min(r, g, b) >= 0 && Math.max(r, g, b) <= 1;
};
