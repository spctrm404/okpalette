export type Vector3 = [number, number, number];
export type Matrix3 = [Vector3, Vector3, Vector3];

export type OutputColorSpaces =
  | "oklab"
  | "oklch"
  | "srgb"
  | "srgb-linear"
  | "display-p3";
export type Gamut = Extract<OutputColorSpaces, "srgb" | "display-p3">;
