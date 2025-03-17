import type { ColorSpace, Vector3 } from "../types";
import {
  oklabToLinearSrgb,
  oklabToLinearDisplayP3,
  linearSrgbToOklab,
  linearDisplayP3ToOklab,
} from "./color";
import { applyGamma, removeGamma } from "./gamma";
import { labTolch, lchToLab } from "./lch";

class Colour {
  lab: Vector3 = [0, 0, 0];
  lch: Vector3 = [0, 0, 0];
  linearSrgb: Vector3 = [0, 0, 0];
  linearDisplayP3: Vector3 = [0, 0, 0];
  constructor(input: {
    lab?: Vector3;
    lch?: Vector3;
    srgb?: Vector3;
    displayP3?: Vector3;
  }) {
    if (input.lab) {
      this.lab = input.lab;
      this.lch = labTolch(this.lab);
      this.linearSrgb = oklabToLinearSrgb(this.lab);
      this.linearDisplayP3 = oklabToLinearDisplayP3(this.lab);
    } else if (input.lch) {
      this.lch = input.lch;
      this.lab = lchToLab(this.lch);
      this.linearSrgb = oklabToLinearSrgb(this.lab);
      this.linearDisplayP3 = oklabToLinearDisplayP3(this.lab);
    } else if (input.srgb) {
      this.linearSrgb = removeGamma(input.srgb);
      this.lab = linearSrgbToOklab(this.linearSrgb);
      this.lch = labTolch(this.lab);
      this.linearDisplayP3 = oklabToLinearDisplayP3(this.lab);
    } else if (input.displayP3) {
      this.linearDisplayP3 = removeGamma(input.displayP3);
      this.lab = linearDisplayP3ToOklab(this.linearDisplayP3);
      this.lch = labTolch(this.lab);
      this.linearSrgb = oklabToLinearSrgb(this.lab);
    }
  }

  inGamut(colorSpace: ColorSpace) {
    const [r, g, b] =
      colorSpace === "srgb" ? this.linearSrgb : this.linearDisplayP3;
    return Math.min(r, g, b) >= 0 && Math.max(r, g, b) <= 1;
  }

  getRgb(colorSpace: ColorSpace) {
    return applyGamma(
      colorSpace === "srgb" ? this.linearSrgb : this.linearDisplayP3,
    );
  }

  getRgbString(colorSpace: ColorSpace) {
    const [r, g, b] = this.getRgb(colorSpace);
    return `color(${colorSpace} ${r} ${g} ${b})`;
  }
}
