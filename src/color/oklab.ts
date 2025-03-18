import type { Vector3, Matrix3 } from "../types";
import { multiplyVector3Matrix3 } from "../util";

// prettier-ignore
const OKLAB_TO_LMS_MATRIX:Matrix3 = [
  [ 1.0000000000000000,  0.3963377773761749,  0.2158037573099136 ],
  [ 1.0000000000000000, -0.1055613458156586, -0.0638541728258133 ],
  [ 1.0000000000000000, -0.0894841775298119, -1.2914855480194092 ],
];
// prettier-ignore
const LMS_TO_XYZ_MATRIX:Matrix3 = [
  [  1.2268798758459243, -0.5578149944602171,  0.2813910456659647 ],
  [ -0.0405757452148008,  1.1122868032803170, -0.0717110580655164 ],
  [ -0.0763729366746601, -0.4214933324022432,  1.5869240198367816 ],
];
// prettier-ignore
const XYZ_TO_LMS_MATRIX:Matrix3 = [
  [ 0.8190224379967030, 0.3619062600528904, -0.1288737815209879 ],
  [ 0.0329836539323885, 0.9292868615863434,  0.0361446663506424 ],
  [ 0.0481771893596242, 0.2642395317527308,  0.6335478284694309 ],
];
// prettier-ignore
const LMS_TO_OKLAB_MATRIX:Matrix3 = [
  [ 0.2104542683093140,  0.7936177747023054, -0.0040720430116193 ],
  [ 1.9779985324311684, -2.4285922420485799,  0.4505937096174110 ],
  [ 0.0259040424655478,  0.7827717124575296, -0.8086757549230774 ],
];

const oklabToLMS = (lab: Vector3): Vector3 => {
  return multiplyVector3Matrix3(lab, OKLAB_TO_LMS_MATRIX);
};
export const oklabToXYZ = (lab: Vector3): Vector3 => {
  const lms = oklabToLMS(lab);
  const linearLms = [lms[0] ** 3, lms[1] ** 3, lms[2] ** 3] as Vector3;
  return multiplyVector3Matrix3(linearLms, LMS_TO_XYZ_MATRIX);
};

const XYZToLinearLMS = (xyz: Vector3): Vector3 => {
  return multiplyVector3Matrix3(xyz, XYZ_TO_LMS_MATRIX);
};
export const XYZToOkLab = (xyz: Vector3): Vector3 => {
  const linearLms = XYZToLinearLMS(xyz);
  const lms = [
    Math.cbrt(linearLms[0]),
    Math.cbrt(linearLms[1]),
    Math.cbrt(linearLms[2]),
  ] as Vector3;
  return multiplyVector3Matrix3(lms, LMS_TO_OKLAB_MATRIX);
};
