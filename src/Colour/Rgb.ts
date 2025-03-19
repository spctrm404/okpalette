import type { Vector3 } from "../types";

export abstract class Rgb {
  protected _linearRgb: Vector3 = [0, 0, 0];
  protected _rgb: Vector3 = [0, 0, 0];

  constructor(input: { linearRgb?: Vector3; rgb?: Vector3 }) {
    if (input.linearRgb) {
      this._linearRgb = input.linearRgb;
      this._rgb = this.toNonLinearFromLinear();
    } else if (input.rgb) {
      this._rgb = input.rgb;
      this._linearRgb = this.toLinearFromNonLinear();
    }
  }

  get linearRgb(): Vector3 {
    return this._linearRgb;
  }
  get rgb(): Vector3 {
    return this._rgb;
  }

  set linearRgb(rgb: Vector3) {
    this._linearRgb = rgb;
    this._rgb = this.toNonLinearFromLinear();
  }
  set rgb(rgb: Vector3) {
    this._rgb = rgb;
    this._linearRgb = this.toLinearFromNonLinear();
  }

  toNonLinearFromLinear(): Vector3 {
    return this._linearRgb.map((val) => {
      const sign = val < 0 ? -1 : 1;
      const abs = val * sign;
      if (abs > 0.0031308) return sign * (1.055 * abs ** (1 / 2.4) - 0.055);
      return 12.92 * val;
    }) as Vector3;
  }
  toLinearFromNonLinear(): Vector3 {
    return this._rgb.map((val) => {
      const sign = val < 0 ? -1 : 1;
      const abs = val * sign;
      if (abs <= 0.04045) return val / 12.92;
      return sign * ((abs + 0.055) / 1.055) ** 2.4;
    }) as Vector3;
  }

  isInGamut(): boolean {
    const [r, g, b] = this._linearRgb;
    return Math.min(r, g, b) >= 0 && Math.max(r, g, b) <= 1;
  }

  abstract toXyzFromLinearRgb(): Vector3;

  abstract toString(base?: "rgb" | "linearRgb"): string;
}
