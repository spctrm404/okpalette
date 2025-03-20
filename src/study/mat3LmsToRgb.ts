// common method: oklab -> non-linear-lms -> linear-lms -> xyz -> linear-rgb
// target method: oklab -> non-linear-lms -> linear-lms -> linear-rgb
// thus, need Matrix of linear-lms -> linear-rgb

import { Srgb } from "../Colour/Srgb";
import { Oklab } from "../Colour/Oklab";
import { multiplyVector3Matrix3 } from "../util";
import { Vector3 } from "../types";

const normalVector: [Vector3, Vector3, Vector3] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

export const rgbFromLms = () => {
  const m1 = Oklab.TO_XYZ_FROM_LMS_MATRIX;
  const m2 = Srgb.TO_RGB_FROM_XYZ_MATRIX;
  normalVector.forEach((vec3) => {
    const result1 = multiplyVector3Matrix3(vec3, m1);
    const result2 = multiplyVector3Matrix3(result1, m2);
    console.log(result2);
  });
};
