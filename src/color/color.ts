import type { Vector3 } from "../types";
import { oklabToXYZ } from "./oklab";
import { lchToLab } from "./lch";
import { XYZToLinearSRgb } from "./srgb";
import { XYZToLinearDisplayP3 } from "./displayp3";
import { applyGamma } from "./gamma";

export const oklabToLinearSRgb = (lab: Vector3): Vector3 => {
  const xyz = oklabToXYZ(lab);
  return XYZToLinearSRgb(xyz);
};
export const oklchToLinearSRgb = (lch: Vector3): Vector3 => {
  const lab = lchToLab(lch);
  return oklabToLinearSRgb(lab);
};

export const oklabToSRgb = (lab: Vector3): Vector3 => {
  const linearSRgb = oklabToLinearSRgb(lab);
  return applyGamma(linearSRgb);
};
export const oklchToSRgb = (lch: Vector3): Vector3 => {
  const lab = lchToLab(lch);
  return oklabToSRgb(lab);
};

export const oklabToLinearDisplayP3 = (lab: Vector3): Vector3 => {
  const xyz = oklabToXYZ(lab);
  return XYZToLinearDisplayP3(xyz);
};
export const oklchToLinearDisplayP3 = (lch: Vector3): Vector3 => {
  const lab = lchToLab(lch);
  return oklabToLinearDisplayP3(lab);
};

export const oklabToDisplayP3 = (lab: Vector3): Vector3 => {
  const linearDisplayP3 = oklabToLinearDisplayP3(lab);
  return applyGamma(linearDisplayP3);
};
export const oklchToDisplayP3 = (lch: Vector3): Vector3 => {
  const lab = lchToLab(lch);
  return oklabToDisplayP3(lab);
};

export const inGamut = ([r, g, b]: Vector3): boolean => {
  return Math.min(r, g, b) >= 0 && Math.max(r, g, b) <= 1;
};
