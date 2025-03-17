import type { Vector3, Matrix3 } from "../types";
import { multiplyMatrix3Vector3 } from "../util";

// prettier-ignore
const RGB_TO_XYZ_MATRIX:Matrix3 = [
	[ 0.4865709486482162, 0.26566769316909306, 0.1982172852343625 ],
	[ 0.2289745640697488, 0.6917385218365064 , 0.079286914093745  ],
	[ 0.0000000000000000, 0.04511338185890264, 1.043944368900976  ],
];
// prettier-ignore
const XYZ_TO_RGB_MATRIX:Matrix3 = [
	[  2.493496911941425  , -0.9313836179191239 , -0.40271078445071684  ],
	[ -0.8294889695615747 ,  1.7626640603183463 ,  0.023624685841943577 ],
	[  0.03584583024378447, -0.07617238926804182,  0.9568845240076872   ],
];

export const linearDisplayP3ToXYZ = (rgb: Vector3): Vector3 => {
  return multiplyMatrix3Vector3(rgb, RGB_TO_XYZ_MATRIX);
};
export const XYZToLinearDisplayP3 = (rgb: Vector3): Vector3 => {
  return multiplyMatrix3Vector3(rgb, XYZ_TO_RGB_MATRIX);
};
