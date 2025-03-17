import type { Vector3, Matrix3 } from "../types";
import { multiplyMatrix3Vector3 } from "../util";

// prettier-ignore
const RGB_TO_XYZ_MATRIX:Matrix3 = [
	[ 0.41239079926595934, 0.357584339383878  , 0.1804807884018343  ],
	[ 0.21263900587151027, 0.715168678767756  , 0.07219231536073371 ],
	[ 0.01933081871559182, 0.11919477979462598, 0.9505321522496607  ],
];
// prettier-ignore
const XYZ_TO_RGB_MATRIX:Matrix3 = [
	[  3.2409699419045226 , -1.537383177570094  , -0.4986107602930034  ],
	[ -0.9692436362808796 ,  1.8759675015077202 ,  0.04155505740717559 ],
	[  0.05563007969699366, -0.20397695888897652,  1.0569715142428786  ],
];

export const linearSRgbToXYZ = (rgb: Vector3): Vector3 => {
  return multiplyMatrix3Vector3(rgb, RGB_TO_XYZ_MATRIX);
};
export const XYZToLinearSRgb = (rgb: Vector3): Vector3 => {
  return multiplyMatrix3Vector3(rgb, XYZ_TO_RGB_MATRIX);
};
