import { Matrix3, Vector3 } from "./types";

// prettier-ignore
export const multiplyMatrix3Vector3 = (vector3: Vector3, matrix3: Matrix3, out:Vector3 = [0, 0, 0]): Vector3 => {
  const dotProductVector3 = (a:Vector3, b:Vector3):number => 
     a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  out[0] = dotProductVector3(vector3, matrix3[0]);
  out[1] = dotProductVector3(vector3, matrix3[1]);
  out[2] = dotProductVector3(vector3, matrix3[2]);
  return out;
};

// prettier-ignore
export const matrix3ToGlslMat3 = (matrix3: Matrix3): Float32Array => {
  return new Float32Array([
    matrix3[0][0], matrix3[1][0], matrix3[2][0],
    matrix3[0][1], matrix3[1][1], matrix3[2][1],
    matrix3[0][2], matrix3[1][2], matrix3[2][2],
  ]);
};
