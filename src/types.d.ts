export type Vector3 = [number, number, number];
export type Matrix3 = [Vector3, Vector3, Vector3];

export type OKCoefficients = [
  {
    limits: [number, number];
    coefficients: [number, number, number, number, number];
  },
  {
    limits: [number, number];
    coefficients: [number, number, number, number, number];
  },
  {
    limits: [number, number];
    coefficients: [number, number, number, number, number];
  },
];

export type CssColorSpaces =
  | "oklab"
  | "oklch"
  | "srgb"
  | "srgb-linear"
  | "display-p3";
export type Gamut = Extract<CssColorSpaces, "srgb" | "display-p3">;
