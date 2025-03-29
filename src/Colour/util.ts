import type { Gamut, Vector3 } from "../types";
import { Rgb } from "./Rgb";
import { Srgb } from "./Srgb";
import { DisplayP3 } from "./Displayp3";
import { Oklab } from "./Oklab";

export const findMaxChromaForLH = (
  l: number,
  h: number,
  options: { gamut: Gamut; epsilon: number } = {
    gamut: "display-p3",
    epsilon: 10e-6,
  },
): number => {
  const { gamut, epsilon } = options;
  let low = 0;
  let high = 0.4;
  while (high - low > epsilon) {
    const mid = (low + high) / 2.0;
    const lchVal: Vector3 = [l, mid, h];
    const labVal = Oklab.toLabFromLch(lchVal);
    const xyzVal = Oklab.toXyzFromOklab(labVal);
    const rgbVal =
      gamut === "srgb"
        ? Srgb.toLinearRgbFromXyz(xyzVal)
        : DisplayP3.toLinearRgbFromXyz(xyzVal);
    if (Rgb.isInGamut(rgbVal)) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return low;
};
