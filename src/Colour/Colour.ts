import { Oklab } from "./Oklab";
import { Srgb } from "./Srgb";
import { DisplayP3 } from "./Displayp3";
import { Vector3 } from "../types";

export class Colour {
  private _oklab!: Oklab;
  private _srgb!: Srgb;
  private _displayP3!: DisplayP3;

  constructor(input: {
    oklab?: Vector3;
    oklch?: Vector3;
    srgb?: Vector3;
    linearSrgb?: Vector3;
    displayP3?: Vector3;
    linearDisplayP3?: Vector3;
  }) {
    const { oklab, oklch, srgb, linearSrgb, displayP3, linearDisplayP3 } =
      input;
    let xyz: Vector3 | undefined;

    if (oklab) {
      this._oklab = new Oklab({ lab: oklab });
      xyz = this._oklab.toXyzFromOklab();
    } else if (oklch) {
      this._oklab = new Oklab({ lch: oklch });
      xyz = this._oklab.toXyzFromOklab();
    } else if (srgb) {
      this._srgb = new Srgb({ rgb: srgb });
      xyz = this._srgb.toXyzFromLinearRgb();
    } else if (linearSrgb) {
      this._srgb = new Srgb({ linearRgb: linearSrgb });
      xyz = this._srgb.toXyzFromLinearRgb();
    } else if (displayP3) {
      this._displayP3 = new DisplayP3({ rgb: displayP3 });
      xyz = this._displayP3.toXyzFromLinearRgb();
    } else if (linearDisplayP3) {
      this._displayP3 = new DisplayP3({ linearRgb: linearDisplayP3 });
      xyz = this._displayP3.toXyzFromLinearRgb();
    }

    if (xyz) this.init(xyz);
  }

  init(xyz: Vector3) {
    if (!this._oklab) {
      const oklab = Oklab.getOklabFromXyz(xyz);
      this._oklab = new Oklab({ lab: oklab });
    }
    if (!this._srgb) {
      const linearSrgb = Srgb.toLinearRgbFromXyz(xyz);
      this._srgb = new Srgb({ linearRgb: linearSrgb });
    }
    if (!this._displayP3) {
      const linearDisplayP3 = DisplayP3.toLinearRgbFromXyz(xyz);
      this._displayP3 = new DisplayP3({ linearRgb: linearDisplayP3 });
    }
  }

  update(
    xyz: Vector3,
    options: { oklab?: boolean; srgb?: boolean; displayP3?: boolean } = {
      oklab: true,
      srgb: true,
      displayP3: true,
    },
  ) {
    if (options.oklab) {
      const oklabValue = Oklab.getOklabFromXyz(xyz);
      this._oklab.lab = oklabValue;
    }
    if (options.srgb) {
      const linearSrgb = Srgb.toLinearRgbFromXyz(xyz);
      this._srgb.linearRgb = linearSrgb;
    }
    if (options.displayP3) {
      const linearDisplayP3 = DisplayP3.toLinearRgbFromXyz(xyz);
      this._displayP3.linearRgb = linearDisplayP3;
    }
  }

  setOklab(lab: Vector3) {
    this._oklab.lab = lab;
    const xyz = this._oklab.toXyzFromOklab();
    this.update(xyz, { oklab: false });
  }
  setOklch(lch: Vector3) {
    this._oklab.lch = lch;
    const xyz = this._oklab.toXyzFromOklab();
    this.update(xyz, { oklab: false });
  }
  setLinearSrgb(linearRgb: Vector3) {
    this._srgb.linearRgb = linearRgb;
    const xyz = this._srgb.toXyzFromLinearRgb();
    this.update(xyz, { srgb: false });
  }
  setSrgb(rgb: Vector3) {
    this._srgb.rgb = rgb;
    const xyz = this._srgb.toXyzFromLinearRgb();
    this.update(xyz, { srgb: false });
  }
  setLinearDisplayP3(linearRgb: Vector3) {
    this._displayP3.linearRgb = linearRgb;
    const xyz = this._displayP3.toXyzFromLinearRgb();
    this.update(xyz, { displayP3: false });
  }
  setDisplayP3(rgb: Vector3) {
    this._displayP3.rgb = rgb;
    const xyz = this._displayP3.toXyzFromLinearRgb();
    this.update(xyz, { displayP3: false });
  }

  getOklab(): Vector3 {
    return this._oklab.lab;
  }
  getOklch(): Vector3 {
    return this._oklab.lch;
  }
  getLinearSrgb(): Vector3 {
    return this._srgb.linearRgb;
  }
  getSrgb(): Vector3 {
    return this._srgb.rgb;
  }
  getLinearDisplayP3(): Vector3 {
    return this._displayP3.linearRgb;
  }
  getDisplayP3(): Vector3 {
    return this._displayP3.rgb;
  }

  isInGamut(gamut: "srgb" | "display-p3"): boolean {
    return gamut === "srgb"
      ? this._srgb.isInGamut()
      : this._displayP3.isInGamut();
  }

  toString(
    colorSpace: "oklab" | "oklch" | "srgb" | "srgb-linear" | "display-p3",
  ) {
    switch (colorSpace) {
      case "oklab":
        return this._oklab.toString("lab");
      case "oklch":
        return this._oklab.toString("lch");
      case "srgb":
        return this._srgb.toString("rgb");
      case "srgb-linear":
        return this._srgb.toString("linearRgb");
      case "display-p3":
        return this._displayP3.toString();
    }
  }
}
