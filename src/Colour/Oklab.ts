import type { Vector3, Matrix3 } from "../types";
import { multiplyVector3Matrix3 } from "../util";

export class Oklab {
  // prettier-ignore
  static TO_LMS_FROM_OKLAB_MATRIX: Matrix3 = [
    [ 1.0000000000000000,  0.3963377773761749,  0.2158037573099136 ],
    [ 1.0000000000000000, -0.1055613458156586, -0.0638541728258133 ],
    [ 1.0000000000000000, -0.0894841775298119, -1.2914855480194092 ],
  ];
  // prettier-ignore
  static TO_XYZ_FROM_LMS_MATRIX: Matrix3 = [
    [  1.2268798758459243, -0.5578149944602171,  0.2813910456659647 ],
    [ -0.0405757452148008,  1.1122868032803170, -0.0717110580655164 ],
    [ -0.0763729366746601, -0.4214933324022432,  1.5869240198367816 ],
  ];
  // prettier-ignore
  static TO_LMS_FROM_XYZ_MATRIX: Matrix3 = [
    [ 0.8190224379967030, 0.3619062600528904, -0.1288737815209879 ],
    [ 0.0329836539323885, 0.9292868615863434,  0.0361446663506424 ],
    [ 0.0481771893596242, 0.2642395317527308,  0.6335478284694309 ],
  ];
  // prettier-ignore
  static TO_OKLAB_FROM_LMS_MATRIX: Matrix3 = [
    [ 0.2104542683093140,  0.7936177747023054, -0.0040720430116193 ],
    [ 1.9779985324311684, -2.4285922420485799,  0.4505937096174110 ],
    [ 0.0259040424655478,  0.7827717124575296, -0.8086757549230774 ],
  ];

  private _lab: Vector3 = [0, 0, 0];
  private _lch: Vector3 = [0, 0, 0];

  constructor(input: { lab?: Vector3; lch?: Vector3 }) {
    if (input.lab) {
      this._lab = input.lab;
      this._lch = this.toLch();
    } else if (input.lch) {
      this._lch = input.lch;
      this._lab = this.toLab();
    }
  }

  getLab(): Vector3 {
    return this._lab;
  }
  getLch(): Vector3 {
    return this._lch;
  }

  setLab(lab: Vector3) {
    this._lab = lab;
    this._lch = this.toLch();
  }
  setLch(lch: Vector3) {
    this._lch = lch;
    this._lab = this.toLab();
  }

  toLch(): Vector3 {
    const [l, a, b] = this._lab;
    const h = (Math.atan2(b, a) * 180.0) / Math.PI;
    return [l, Math.sqrt(a ** 2 + b ** 2), h >= 0 ? h : h + 360.0];
  }
  static toLchFromLab(lab: Vector3): Vector3 {
    const [l, a, b] = lab;
    const h = (Math.atan2(b, a) * 180.0) / Math.PI;
    return [l, Math.sqrt(a ** 2 + b ** 2), h >= 0 ? h : h + 360.0];
  }

  toLab(): Vector3 {
    const [l, c, h] = this._lch;
    return [
      l,
      c * Math.cos((h * Math.PI) / 180.0),
      c * Math.sin((h * Math.PI) / 180.0),
    ];
  }
  static toLabFromLch(lch: Vector3): Vector3 {
    const [l, c, h] = lch;
    return [
      l,
      c * Math.cos((h * Math.PI) / 180.0),
      c * Math.sin((h * Math.PI) / 180.0),
    ];
  }

  private toLms(): Vector3 {
    return multiplyVector3Matrix3(this._lab, Oklab.TO_LMS_FROM_OKLAB_MATRIX);
  }
  toXyz(): Vector3 {
    const lms = this.toLms();
    const linearLms = lms.map((val) => val ** 3) as Vector3;
    return multiplyVector3Matrix3(linearLms, Oklab.TO_XYZ_FROM_LMS_MATRIX);
  }
  private static toLmsFromOklab(lab: Vector3): Vector3 {
    return multiplyVector3Matrix3(lab, Oklab.TO_LMS_FROM_OKLAB_MATRIX);
  }
  static toXyzFromOklab(lab: Vector3): Vector3 {
    const lms = Oklab.toLmsFromOklab(lab);
    const linearLms: Vector3 = lms.map((val) => val ** 3) as Vector3;
    return multiplyVector3Matrix3(linearLms, Oklab.TO_XYZ_FROM_LMS_MATRIX);
  }

  private static toLinearLmsFromXyz(xyz: Vector3): Vector3 {
    return multiplyVector3Matrix3(xyz, Oklab.TO_LMS_FROM_XYZ_MATRIX);
  }
  static toOklabFromXyz(xyz: Vector3): Vector3 {
    const linearLms = Oklab.toLinearLmsFromXyz(xyz);
    const lms = linearLms.map((val) => Math.cbrt(val)) as Vector3;
    return multiplyVector3Matrix3(lms, Oklab.TO_OKLAB_FROM_LMS_MATRIX);
  }

  toString(base: "lab" | "lch") {
    const [x, y, z] = base === "lab" ? this._lab : this._lch;
    return `${base === "lab" ? "oklab" : "oklch"}(${100 * x}% ${y} ${z})`;
  }
}
