import type { Vector3, Matrix3 } from "../types";
import { Rgb } from "./Rgb";
import { multiplyVector3Matrix3 } from "../util";

export class DisplayP3 extends Rgb {
  // prettier-ignore
  static TO_XYZ_FROM_RGB_MATRIX: Matrix3 = [
	  [ 0.4865709486482162, 0.26566769316909306, 0.1982172852343625 ],
	  [ 0.2289745640697488, 0.6917385218365064 , 0.079286914093745  ],
	  [ 0.0000000000000000, 0.04511338185890264, 1.043944368900976  ],
  ];
  // prettier-ignore
  static TO_RGB_FROM_XYZ_MATRIX: Matrix3 = [
	  [  2.493496911941425  , -0.9313836179191239 , -0.40271078445071684  ],
	  [ -0.8294889695615747 ,  1.7626640603183463 ,  0.023624685841943577 ],
	  [  0.03584583024378447, -0.07617238926804182,  0.9568845240076872   ],
  ];

  constructor(input: { linearRgb?: Vector3; rgb?: Vector3 }) {
    super(input);
  }

  toXyzFromLinearRgb(): Vector3 {
    return multiplyVector3Matrix3(
      this._linearRgb,
      DisplayP3.TO_XYZ_FROM_RGB_MATRIX,
    );
  }
  toLinearRgbFromXyz(xyz: Vector3): Vector3 {
    return multiplyVector3Matrix3(xyz, DisplayP3.TO_RGB_FROM_XYZ_MATRIX);
  }

  toString(): string {
    const [r, g, b] = this._rgb;
    return `color(display-p3 ${r} ${g} ${b})`;
  }
}
