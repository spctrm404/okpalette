import { Oklab } from "./Oklab";
import { Srgb } from "./Srgb";
import { DisplayP3 } from "./Displayp3";
import { Vector3 } from "../types";

class Colour {
  oklab: Oklab;
  srgb: Srgb;
  displayP3: DisplayP3;
  constructor(input: {
    lab?: Vector3;
    lch?: Vector3;
    srgb?: Vector3;
    linearSrgb?: Vector3;
    displayP3?: Vector3;
    linearDisplayP3?: Vector3;
  }) {}
}
