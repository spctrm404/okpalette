// common method: linear-rgb -> xyz -> linear-lms -> non-linear-lms -> oklab
// target method: linear-rgb -> linear-lms -> non-linear-lms -> oklab
// thus, need Matrix of linear-rgb -> linear-lms

import { Srgb } from "../Colour/Srgb";
import { Oklab } from "../Colour/Oklab";
import { multiplyVector3Matrix3 } from "../util";
import { Vector3 } from "../types";

const normalVector: [Vector3, Vector3, Vector3] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

export const lmsFromRgb = () => {
  const m1 = Srgb.TO_XYZ_FROM_RGB_MATRIX;
  const m2 = Oklab.TO_LMS_FROM_XYZ_MATRIX;
  normalVector.forEach((vec3) => {
    const result1 = multiplyVector3Matrix3(vec3, m1);
    const result2 = multiplyVector3Matrix3(result1, m2);
    console.log(result2);
  });
};
