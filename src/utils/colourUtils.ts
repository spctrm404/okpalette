import { RGB, LCH, CuloriOklch } from '../types/colourTypes';
import {
  Hues,
  PaletteParam,
  Palette,
  Swatch,
  ApcaMatrix,
} from '../types/paletteTypes';
import { FigmaDocumentColorSpace } from '../types/figmaTypes';

import {
  LIGHTNESS_STEP,
  CHROMA_STEP,
  HUE_STEP,
  DISP_P3_CHROMA_LIMIT,
} from '../constants';

import { quantize } from './numberUtils';

import { inGamut, converter, clampChroma } from 'culori';
import { APCAcontrast, displayP3toY, sRGBtoY } from 'apca-w3';

export const nomalizedRgbToHex = ({ r, g, b }: RGB): string =>
  [r, g, b]
    .map((value) =>
      Math.round(value * 255)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase()
    )
    .join('');

export const hueForLightness = (
  lightness: number,
  { from, to }: Hues
): number => {
  const hueDiff = from <= to ? to - from : to + 360 - from;
  return (from + lightness * hueDiff) % 360;
};

export const chromaForLightness = (
  lightness: number,
  peakLightness: number,
  peakChroma: number
): number => {
  const chroma =
    peakLightness === 1
      ? peakChroma * lightness
      : peakLightness === 0
      ? peakChroma * (1 - lightness)
      : lightness <= peakLightness
      ? (peakChroma / peakLightness) * lightness
      : (peakChroma / (1 - peakLightness)) * (1 - lightness);
  return chroma;
};

export const peakChromaForLightnessAndHue = (
  peakLightness: number,
  hues: Hues
): number => {
  const hue = hueForLightness(peakLightness, hues);
  let low = 0;
  let high = DISP_P3_CHROMA_LIMIT;
  const inDispP3 = inGamut('p3');
  while (high - low > CHROMA_STEP) {
    const mid = (low + high) / 2;
    const oklch: CuloriOklch = {
      mode: 'oklch',
      l: peakLightness,
      c: mid,
      h: hue,
    };
    const isDispP3 = inDispP3(oklch);
    if (isDispP3) {
      low = mid; // chroma can be higher
    } else {
      high = mid; // chroma must be lower
    }
  }
  return low;
};

export const peakChromaAndLightnessForHue = () => {
  const inP3 = inGamut('p3');
  const list: LCH[] = [];
  for (let hue = 0; hue <= 360; hue += HUE_STEP) {
    let maxChromaForHue = 0;
    let correspondingLightness = 0;
    for (let lightness = 1; lightness > 0; lightness -= LIGHTNESS_STEP) {
      let maxChromaForLightness = 0;
      for (
        let chroma = 0;
        chroma <= DISP_P3_CHROMA_LIMIT;
        chroma += CHROMA_STEP
      ) {
        const oklch: CuloriOklch = {
          mode: 'oklch',
          l: lightness,
          c: chroma,
          h: hue,
        };
        if (inP3(oklch)) {
          if (chroma > maxChromaForLightness) maxChromaForLightness = chroma;
        } else {
          break;
        }
      }
      if (maxChromaForLightness > maxChromaForHue) {
        maxChromaForHue = maxChromaForLightness;
        correspondingLightness = lightness;
      } else if (maxChromaForLightness < maxChromaForHue) {
        break;
      }
    }
    list.push({
      l: correspondingLightness,
      c: maxChromaForHue,
      h: hue,
    });
  }

  return list;
};

export const createPalette = ({
  swatchStep,
  peakLightness,
  peakChroma,
  hues,
}: PaletteParam): Palette => {
  const total = 100 / swatchStep + 1;
  const swatches: Swatch[] = [];
  const inDispP3 = inGamut('p3');
  const inSRgb = inGamut('rgb');
  const toDispP3 = converter('p3');
  const toSRgb = converter('rgb');
  for (let n = 0; n < total; n++) {
    const lightness = quantize(n / (total - 1), LIGHTNESS_STEP);
    const chroma = quantize(
      chromaForLightness(lightness, peakLightness, peakChroma),
      CHROMA_STEP
    );
    const hue = hueForLightness(lightness, hues);

    if (lightness === 0) {
      swatches.push({
        oklch: { l: 0, c: 0, h: hue },
        dispP3Oklch: { l: 0, c: 0, h: hue },
        dispP3: { r: 0, g: 0, b: 0 },
        dispP3Hex: '000000',
        sRgbOklch: { l: 0, c: 0, h: hue },
        sRgb: { r: 0, g: 0, b: 0 },
        sRgbHex: '000000',
        gamut: 'sRGB',
      });
    } else if (lightness === 1) {
      swatches.push({
        oklch: { l: 1, c: 0, h: hue },
        dispP3Oklch: { l: 1, c: 0, h: hue },
        dispP3: { r: 1, g: 1, b: 1 },
        dispP3Hex: 'FFFFFF',
        sRgbOklch: { l: 1, c: 0, h: hue },
        sRgb: { r: 1, g: 1, b: 1 },
        sRgbHex: 'FFFFFF',
        gamut: 'sRGB',
      });
    } else {
      const oklch: CuloriOklch = {
        mode: 'oklch',
        l: lightness,
        c: chroma,
        h: hue,
      };
      const isDispP3 = inDispP3(oklch);
      const isSRgb = inSRgb(oklch);
      const dispP3Oklch = clampChroma(oklch, 'oklch', 'p3');
      const dispP3 = toDispP3(dispP3Oklch);
      const dispP3Hex = nomalizedRgbToHex(dispP3);
      const sRgbOklch = clampChroma(oklch, 'oklch', 'rgb');
      const sRgb = toSRgb(sRgbOklch);
      const sRgbHex = nomalizedRgbToHex(sRgb);
      swatches.push({
        oklch,
        dispP3Oklch,
        dispP3,
        dispP3Hex,
        sRgbOklch,
        sRgb,
        sRgbHex,
        gamut: isSRgb ? 'sRGB' : 'Display P3',
      });
    }
  }

  return { swatchStep, peakLightness, peakChroma, hues, swatches };
};

export const LightnessAndChromaPeaksOfHues = [
  {
    hue: 0,
    lightness: 0.67,
    chroma: 0.305,
  },
  {
    hue: 1,
    lightness: 0.67,
    chroma: 0.304,
  },
  {
    hue: 2,
    lightness: 0.67,
    chroma: 0.301,
  },
  {
    hue: 3,
    lightness: 0.67,
    chroma: 0.299,
  },
  {
    hue: 4,
    lightness: 0.66,
    chroma: 0.299,
  },
  {
    hue: 5,
    lightness: 0.66,
    chroma: 0.298,
  },
  {
    hue: 6,
    lightness: 0.66,
    chroma: 0.298,
  },
  {
    hue: 7,
    lightness: 0.66,
    chroma: 0.298,
  },
  {
    hue: 8,
    lightness: 0.66,
    chroma: 0.298,
  },
  {
    hue: 9,
    lightness: 0.66,
    chroma: 0.297,
  },
  {
    hue: 10,
    lightness: 0.66,
    chroma: 0.297,
  },
  {
    hue: 11,
    lightness: 0.66,
    chroma: 0.297,
  },
  {
    hue: 12,
    lightness: 0.66,
    chroma: 0.295,
  },
  {
    hue: 13,
    lightness: 0.66,
    chroma: 0.294,
  },
  {
    hue: 14,
    lightness: 0.66,
    chroma: 0.293,
  },
  {
    hue: 15,
    lightness: 0.65,
    chroma: 0.293,
  },
  {
    hue: 16,
    lightness: 0.65,
    chroma: 0.293,
  },
  {
    hue: 17,
    lightness: 0.65,
    chroma: 0.293,
  },
  {
    hue: 18,
    lightness: 0.65,
    chroma: 0.293,
  },
  {
    hue: 19,
    lightness: 0.65,
    chroma: 0.294,
  },
  {
    hue: 20,
    lightness: 0.65,
    chroma: 0.294,
  },
  {
    hue: 21,
    lightness: 0.65,
    chroma: 0.294,
  },
  {
    hue: 22,
    lightness: 0.65,
    chroma: 0.295,
  },
  {
    hue: 23,
    lightness: 0.65,
    chroma: 0.295,
  },
  {
    hue: 24,
    lightness: 0.65,
    chroma: 0.296,
  },
  {
    hue: 25,
    lightness: 0.65,
    chroma: 0.297,
  },
  {
    hue: 26,
    lightness: 0.65,
    chroma: 0.297,
  },
  {
    hue: 27,
    lightness: 0.65,
    chroma: 0.297,
  },
  {
    hue: 28,
    lightness: 0.65,
    chroma: 0.297,
  },
  {
    hue: 29,
    lightness: 0.65,
    chroma: 0.297,
  },
  {
    hue: 30,
    lightness: 0.65,
    chroma: 0.291,
  },
  {
    hue: 31,
    lightness: 0.66,
    chroma: 0.286,
  },
  {
    hue: 32,
    lightness: 0.66,
    chroma: 0.28,
  },
  {
    hue: 33,
    lightness: 0.67,
    chroma: 0.276,
  },
  {
    hue: 34,
    lightness: 0.67,
    chroma: 0.27,
  },
  {
    hue: 35,
    lightness: 0.68,
    chroma: 0.266,
  },
  {
    hue: 36,
    lightness: 0.68,
    chroma: 0.262,
  },
  {
    hue: 37,
    lightness: 0.69,
    chroma: 0.257,
  },
  {
    hue: 38,
    lightness: 0.69,
    chroma: 0.254,
  },
  {
    hue: 39,
    lightness: 0.69,
    chroma: 0.249,
  },
  {
    hue: 40,
    lightness: 0.7,
    chroma: 0.248,
  },
  {
    hue: 41,
    lightness: 0.7,
    chroma: 0.243,
  },
  {
    hue: 42,
    lightness: 0.71,
    chroma: 0.24,
  },
  {
    hue: 43,
    lightness: 0.71,
    chroma: 0.238,
  },
  {
    hue: 44,
    lightness: 0.71,
    chroma: 0.234,
  },
  {
    hue: 45,
    lightness: 0.72,
    chroma: 0.233,
  },
  {
    hue: 46,
    lightness: 0.72,
    chroma: 0.229,
  },
  {
    hue: 47,
    lightness: 0.73,
    chroma: 0.226,
  },
  {
    hue: 48,
    lightness: 0.73,
    chroma: 0.225,
  },
  {
    hue: 49,
    lightness: 0.73,
    chroma: 0.222,
  },
  {
    hue: 50,
    lightness: 0.74,
    chroma: 0.22,
  },
  {
    hue: 51,
    lightness: 0.74,
    chroma: 0.219,
  },
  {
    hue: 52,
    lightness: 0.74,
    chroma: 0.216,
  },
  {
    hue: 53,
    lightness: 0.75,
    chroma: 0.215,
  },
  {
    hue: 54,
    lightness: 0.75,
    chroma: 0.214,
  },
  {
    hue: 55,
    lightness: 0.75,
    chroma: 0.211,
  },
  {
    hue: 56,
    lightness: 0.76,
    chroma: 0.21,
  },
  {
    hue: 57,
    lightness: 0.76,
    chroma: 0.209,
  },
  {
    hue: 58,
    lightness: 0.76,
    chroma: 0.207,
  },
  {
    hue: 59,
    lightness: 0.77,
    chroma: 0.206,
  },
  {
    hue: 60,
    lightness: 0.77,
    chroma: 0.206,
  },
  {
    hue: 61,
    lightness: 0.77,
    chroma: 0.204,
  },
  {
    hue: 62,
    lightness: 0.78,
    chroma: 0.202,
  },
  {
    hue: 63,
    lightness: 0.78,
    chroma: 0.203,
  },
  {
    hue: 64,
    lightness: 0.78,
    chroma: 0.201,
  },
  {
    hue: 65,
    lightness: 0.78,
    chroma: 0.2,
  },
  {
    hue: 66,
    lightness: 0.79,
    chroma: 0.201,
  },
  {
    hue: 67,
    lightness: 0.79,
    chroma: 0.2,
  },
  {
    hue: 68,
    lightness: 0.79,
    chroma: 0.198,
  },
  {
    hue: 69,
    lightness: 0.8,
    chroma: 0.2,
  },
  {
    hue: 70,
    lightness: 0.8,
    chroma: 0.198,
  },
  {
    hue: 71,
    lightness: 0.8,
    chroma: 0.197,
  },
  {
    hue: 72,
    lightness: 0.81,
    chroma: 0.198,
  },
  {
    hue: 73,
    lightness: 0.81,
    chroma: 0.198,
  },
  {
    hue: 74,
    lightness: 0.81,
    chroma: 0.197,
  },
  {
    hue: 75,
    lightness: 0.82,
    chroma: 0.197,
  },
  {
    hue: 76,
    lightness: 0.82,
    chroma: 0.198,
  },
  {
    hue: 77,
    lightness: 0.82,
    chroma: 0.197,
  },
  {
    hue: 78,
    lightness: 0.83,
    chroma: 0.197,
  },
  {
    hue: 79,
    lightness: 0.83,
    chroma: 0.198,
  },
  {
    hue: 80,
    lightness: 0.83,
    chroma: 0.197,
  },
  {
    hue: 81,
    lightness: 0.84,
    chroma: 0.197,
  },
  {
    hue: 82,
    lightness: 0.84,
    chroma: 0.199,
  },
  {
    hue: 83,
    lightness: 0.84,
    chroma: 0.199,
  },
  {
    hue: 84,
    lightness: 0.85,
    chroma: 0.199,
  },
  {
    hue: 85,
    lightness: 0.85,
    chroma: 0.2,
  },
  {
    hue: 86,
    lightness: 0.85,
    chroma: 0.2,
  },
  {
    hue: 87,
    lightness: 0.86,
    chroma: 0.201,
  },
  {
    hue: 88,
    lightness: 0.86,
    chroma: 0.202,
  },
  {
    hue: 89,
    lightness: 0.86,
    chroma: 0.202,
  },
  {
    hue: 90,
    lightness: 0.87,
    chroma: 0.205,
  },
  {
    hue: 91,
    lightness: 0.87,
    chroma: 0.205,
  },
  {
    hue: 92,
    lightness: 0.87,
    chroma: 0.205,
  },
  {
    hue: 93,
    lightness: 0.88,
    chroma: 0.208,
  },
  {
    hue: 94,
    lightness: 0.88,
    chroma: 0.208,
  },
  {
    hue: 95,
    lightness: 0.89,
    chroma: 0.21,
  },
  {
    hue: 96,
    lightness: 0.89,
    chroma: 0.211,
  },
  {
    hue: 97,
    lightness: 0.89,
    chroma: 0.212,
  },
  {
    hue: 98,
    lightness: 0.9,
    chroma: 0.215,
  },
  {
    hue: 99,
    lightness: 0.9,
    chroma: 0.215,
  },
  {
    hue: 100,
    lightness: 0.91,
    chroma: 0.219,
  },
  {
    hue: 101,
    lightness: 0.91,
    chroma: 0.219,
  },
  {
    hue: 102,
    lightness: 0.92,
    chroma: 0.223,
  },
  {
    hue: 103,
    lightness: 0.92,
    chroma: 0.224,
  },
  {
    hue: 104,
    lightness: 0.93,
    chroma: 0.227,
  },
  {
    hue: 105,
    lightness: 0.93,
    chroma: 0.228,
  },
  {
    hue: 106,
    lightness: 0.94,
    chroma: 0.232,
  },
  {
    hue: 107,
    lightness: 0.94,
    chroma: 0.233,
  },
  {
    hue: 108,
    lightness: 0.95,
    chroma: 0.237,
  },
  {
    hue: 109,
    lightness: 0.95,
    chroma: 0.239,
  },
  {
    hue: 110,
    lightness: 0.96,
    chroma: 0.243,
  },
  {
    hue: 111,
    lightness: 0.96,
    chroma: 0.245,
  },
  {
    hue: 112,
    lightness: 0.96,
    chroma: 0.244,
  },
  {
    hue: 113,
    lightness: 0.95,
    chroma: 0.246,
  },
  {
    hue: 114,
    lightness: 0.95,
    chroma: 0.248,
  },
  {
    hue: 115,
    lightness: 0.95,
    chroma: 0.25,
  },
  {
    hue: 116,
    lightness: 0.94,
    chroma: 0.25,
  },
  {
    hue: 117,
    lightness: 0.94,
    chroma: 0.252,
  },
  {
    hue: 118,
    lightness: 0.94,
    chroma: 0.254,
  },
  {
    hue: 119,
    lightness: 0.94,
    chroma: 0.256,
  },
  {
    hue: 120,
    lightness: 0.93,
    chroma: 0.257,
  },
  {
    hue: 121,
    lightness: 0.93,
    chroma: 0.26,
  },
  {
    hue: 122,
    lightness: 0.93,
    chroma: 0.263,
  },
  {
    hue: 123,
    lightness: 0.92,
    chroma: 0.263,
  },
  {
    hue: 124,
    lightness: 0.92,
    chroma: 0.266,
  },
  {
    hue: 125,
    lightness: 0.92,
    chroma: 0.269,
  },
  {
    hue: 126,
    lightness: 0.91,
    chroma: 0.27,
  },
  {
    hue: 127,
    lightness: 0.91,
    chroma: 0.274,
  },
  {
    hue: 128,
    lightness: 0.91,
    chroma: 0.278,
  },
  {
    hue: 129,
    lightness: 0.91,
    chroma: 0.281,
  },
  {
    hue: 130,
    lightness: 0.9,
    chroma: 0.283,
  },
  {
    hue: 131,
    lightness: 0.9,
    chroma: 0.287,
  },
  {
    hue: 132,
    lightness: 0.9,
    chroma: 0.292,
  },
  {
    hue: 133,
    lightness: 0.89,
    chroma: 0.294,
  },
  {
    hue: 134,
    lightness: 0.89,
    chroma: 0.299,
  },
  {
    hue: 135,
    lightness: 0.89,
    chroma: 0.304,
  },
  {
    hue: 136,
    lightness: 0.88,
    chroma: 0.307,
  },
  {
    hue: 137,
    lightness: 0.88,
    chroma: 0.313,
  },
  {
    hue: 138,
    lightness: 0.88,
    chroma: 0.316,
  },
  {
    hue: 139,
    lightness: 0.87,
    chroma: 0.322,
  },
  {
    hue: 140,
    lightness: 0.87,
    chroma: 0.329,
  },
  {
    hue: 141,
    lightness: 0.86,
    chroma: 0.332,
  },
  {
    hue: 142,
    lightness: 0.86,
    chroma: 0.34,
  },
  {
    hue: 143,
    lightness: 0.86,
    chroma: 0.348,
  },
  {
    hue: 144,
    lightness: 0.85,
    chroma: 0.353,
  },
  {
    hue: 145,
    lightness: 0.85,
    chroma: 0.362,
  },
  {
    hue: 146,
    lightness: 0.85,
    chroma: 0.362,
  },
  {
    hue: 147,
    lightness: 0.85,
    chroma: 0.354,
  },
  {
    hue: 148,
    lightness: 0.85,
    chroma: 0.344,
  },
  {
    hue: 149,
    lightness: 0.85,
    chroma: 0.335,
  },
  {
    hue: 150,
    lightness: 0.85,
    chroma: 0.326,
  },
  {
    hue: 151,
    lightness: 0.85,
    chroma: 0.318,
  },
  {
    hue: 152,
    lightness: 0.85,
    chroma: 0.311,
  },
  {
    hue: 153,
    lightness: 0.85,
    chroma: 0.303,
  },
  {
    hue: 154,
    lightness: 0.85,
    chroma: 0.297,
  },
  {
    hue: 155,
    lightness: 0.85,
    chroma: 0.291,
  },
  {
    hue: 156,
    lightness: 0.86,
    chroma: 0.288,
  },
  {
    hue: 157,
    lightness: 0.86,
    chroma: 0.282,
  },
  {
    hue: 158,
    lightness: 0.86,
    chroma: 0.277,
  },
  {
    hue: 159,
    lightness: 0.86,
    chroma: 0.272,
  },
  {
    hue: 160,
    lightness: 0.86,
    chroma: 0.267,
  },
  {
    hue: 161,
    lightness: 0.86,
    chroma: 0.263,
  },
  {
    hue: 162,
    lightness: 0.86,
    chroma: 0.259,
  },
  {
    hue: 163,
    lightness: 0.86,
    chroma: 0.255,
  },
  {
    hue: 164,
    lightness: 0.86,
    chroma: 0.251,
  },
  {
    hue: 165,
    lightness: 0.86,
    chroma: 0.247,
  },
  {
    hue: 166,
    lightness: 0.87,
    chroma: 0.245,
  },
  {
    hue: 167,
    lightness: 0.87,
    chroma: 0.243,
  },
  {
    hue: 168,
    lightness: 0.87,
    chroma: 0.24,
  },
  {
    hue: 169,
    lightness: 0.87,
    chroma: 0.237,
  },
  {
    hue: 170,
    lightness: 0.87,
    chroma: 0.235,
  },
  {
    hue: 171,
    lightness: 0.87,
    chroma: 0.232,
  },
  {
    hue: 172,
    lightness: 0.87,
    chroma: 0.229,
  },
  {
    hue: 173,
    lightness: 0.87,
    chroma: 0.227,
  },
  {
    hue: 174,
    lightness: 0.87,
    chroma: 0.225,
  },
  {
    hue: 175,
    lightness: 0.87,
    chroma: 0.223,
  },
  {
    hue: 176,
    lightness: 0.87,
    chroma: 0.221,
  },
  {
    hue: 177,
    lightness: 0.87,
    chroma: 0.219,
  },
  {
    hue: 178,
    lightness: 0.88,
    chroma: 0.219,
  },
  {
    hue: 179,
    lightness: 0.88,
    chroma: 0.218,
  },
  {
    hue: 180,
    lightness: 0.88,
    chroma: 0.216,
  },
  {
    hue: 181,
    lightness: 0.88,
    chroma: 0.214,
  },
  {
    hue: 182,
    lightness: 0.88,
    chroma: 0.213,
  },
  {
    hue: 183,
    lightness: 0.88,
    chroma: 0.212,
  },
  {
    hue: 184,
    lightness: 0.88,
    chroma: 0.21,
  },
  {
    hue: 185,
    lightness: 0.88,
    chroma: 0.209,
  },
  {
    hue: 186,
    lightness: 0.88,
    chroma: 0.208,
  },
  {
    hue: 187,
    lightness: 0.88,
    chroma: 0.207,
  },
  {
    hue: 188,
    lightness: 0.88,
    chroma: 0.206,
  },
  {
    hue: 189,
    lightness: 0.89,
    chroma: 0.205,
  },
  {
    hue: 190,
    lightness: 0.89,
    chroma: 0.207,
  },
  {
    hue: 191,
    lightness: 0.89,
    chroma: 0.206,
  },
  {
    hue: 192,
    lightness: 0.89,
    chroma: 0.205,
  },
  {
    hue: 193,
    lightness: 0.89,
    chroma: 0.205,
  },
  {
    hue: 194,
    lightness: 0.88,
    chroma: 0.202,
  },
  {
    hue: 195,
    lightness: 0.88,
    chroma: 0.201,
  },
  {
    hue: 196,
    lightness: 0.87,
    chroma: 0.199,
  },
  {
    hue: 197,
    lightness: 0.87,
    chroma: 0.198,
  },
  {
    hue: 198,
    lightness: 0.86,
    chroma: 0.196,
  },
  {
    hue: 199,
    lightness: 0.86,
    chroma: 0.196,
  },
  {
    hue: 200,
    lightness: 0.85,
    chroma: 0.193,
  },
  {
    hue: 201,
    lightness: 0.85,
    chroma: 0.193,
  },
  {
    hue: 202,
    lightness: 0.85,
    chroma: 0.191,
  },
  {
    hue: 203,
    lightness: 0.84,
    chroma: 0.191,
  },
  {
    hue: 204,
    lightness: 0.84,
    chroma: 0.19,
  },
  {
    hue: 205,
    lightness: 0.83,
    chroma: 0.189,
  },
  {
    hue: 206,
    lightness: 0.83,
    chroma: 0.189,
  },
  {
    hue: 207,
    lightness: 0.82,
    chroma: 0.187,
  },
  {
    hue: 208,
    lightness: 0.82,
    chroma: 0.188,
  },
  {
    hue: 209,
    lightness: 0.81,
    chroma: 0.186,
  },
  {
    hue: 210,
    lightness: 0.81,
    chroma: 0.186,
  },
  {
    hue: 211,
    lightness: 0.8,
    chroma: 0.185,
  },
  {
    hue: 212,
    lightness: 0.8,
    chroma: 0.185,
  },
  {
    hue: 213,
    lightness: 0.8,
    chroma: 0.185,
  },
  {
    hue: 214,
    lightness: 0.79,
    chroma: 0.184,
  },
  {
    hue: 215,
    lightness: 0.79,
    chroma: 0.185,
  },
  {
    hue: 216,
    lightness: 0.78,
    chroma: 0.184,
  },
  {
    hue: 217,
    lightness: 0.78,
    chroma: 0.184,
  },
  {
    hue: 218,
    lightness: 0.78,
    chroma: 0.184,
  },
  {
    hue: 219,
    lightness: 0.77,
    chroma: 0.184,
  },
  {
    hue: 220,
    lightness: 0.77,
    chroma: 0.185,
  },
  {
    hue: 221,
    lightness: 0.76,
    chroma: 0.184,
  },
  {
    hue: 222,
    lightness: 0.76,
    chroma: 0.185,
  },
  {
    hue: 223,
    lightness: 0.76,
    chroma: 0.184,
  },
  {
    hue: 224,
    lightness: 0.75,
    chroma: 0.186,
  },
  {
    hue: 225,
    lightness: 0.75,
    chroma: 0.186,
  },
  {
    hue: 226,
    lightness: 0.74,
    chroma: 0.186,
  },
  {
    hue: 227,
    lightness: 0.74,
    chroma: 0.188,
  },
  {
    hue: 228,
    lightness: 0.73,
    chroma: 0.187,
  },
  {
    hue: 229,
    lightness: 0.73,
    chroma: 0.189,
  },
  {
    hue: 230,
    lightness: 0.73,
    chroma: 0.188,
  },
  {
    hue: 231,
    lightness: 0.72,
    chroma: 0.191,
  },
  {
    hue: 232,
    lightness: 0.72,
    chroma: 0.191,
  },
  {
    hue: 233,
    lightness: 0.71,
    chroma: 0.192,
  },
  {
    hue: 234,
    lightness: 0.71,
    chroma: 0.193,
  },
  {
    hue: 235,
    lightness: 0.7,
    chroma: 0.194,
  },
  {
    hue: 236,
    lightness: 0.7,
    chroma: 0.196,
  },
  {
    hue: 237,
    lightness: 0.69,
    chroma: 0.197,
  },
  {
    hue: 238,
    lightness: 0.69,
    chroma: 0.2,
  },
  {
    hue: 239,
    lightness: 0.68,
    chroma: 0.2,
  },
  {
    hue: 240,
    lightness: 0.68,
    chroma: 0.203,
  },
  {
    hue: 241,
    lightness: 0.67,
    chroma: 0.203,
  },
  {
    hue: 242,
    lightness: 0.67,
    chroma: 0.206,
  },
  {
    hue: 243,
    lightness: 0.66,
    chroma: 0.207,
  },
  {
    hue: 244,
    lightness: 0.66,
    chroma: 0.21,
  },
  {
    hue: 245,
    lightness: 0.65,
    chroma: 0.212,
  },
  {
    hue: 246,
    lightness: 0.65,
    chroma: 0.214,
  },
  {
    hue: 247,
    lightness: 0.64,
    chroma: 0.218,
  },
  {
    hue: 248,
    lightness: 0.63,
    chroma: 0.219,
  },
  {
    hue: 249,
    lightness: 0.63,
    chroma: 0.223,
  },
  {
    hue: 250,
    lightness: 0.62,
    chroma: 0.226,
  },
  {
    hue: 251,
    lightness: 0.62,
    chroma: 0.228,
  },
  {
    hue: 252,
    lightness: 0.61,
    chroma: 0.233,
  },
  {
    hue: 253,
    lightness: 0.6,
    chroma: 0.237,
  },
  {
    hue: 254,
    lightness: 0.59,
    chroma: 0.24,
  },
  {
    hue: 255,
    lightness: 0.59,
    chroma: 0.244,
  },
  {
    hue: 256,
    lightness: 0.58,
    chroma: 0.25,
  },
  {
    hue: 257,
    lightness: 0.57,
    chroma: 0.256,
  },
  {
    hue: 258,
    lightness: 0.56,
    chroma: 0.262,
  },
  {
    hue: 259,
    lightness: 0.55,
    chroma: 0.268,
  },
  {
    hue: 260,
    lightness: 0.54,
    chroma: 0.274,
  },
  {
    hue: 261,
    lightness: 0.52,
    chroma: 0.281,
  },
  {
    hue: 262,
    lightness: 0.51,
    chroma: 0.293,
  },
  {
    hue: 263,
    lightness: 0.49,
    chroma: 0.303,
  },
  {
    hue: 264,
    lightness: 0.47,
    chroma: 0.32,
  },
  {
    hue: 265,
    lightness: 0.47,
    chroma: 0.32,
  },
  {
    hue: 266,
    lightness: 0.47,
    chroma: 0.32,
  },
  {
    hue: 267,
    lightness: 0.47,
    chroma: 0.317,
  },
  {
    hue: 268,
    lightness: 0.47,
    chroma: 0.314,
  },
  {
    hue: 269,
    lightness: 0.48,
    chroma: 0.313,
  },
  {
    hue: 270,
    lightness: 0.48,
    chroma: 0.314,
  },
  {
    hue: 271,
    lightness: 0.48,
    chroma: 0.313,
  },
  {
    hue: 272,
    lightness: 0.48,
    chroma: 0.311,
  },
  {
    hue: 273,
    lightness: 0.49,
    chroma: 0.308,
  },
  {
    hue: 274,
    lightness: 0.49,
    chroma: 0.309,
  },
  {
    hue: 275,
    lightness: 0.49,
    chroma: 0.309,
  },
  {
    hue: 276,
    lightness: 0.49,
    chroma: 0.308,
  },
  {
    hue: 277,
    lightness: 0.49,
    chroma: 0.306,
  },
  {
    hue: 278,
    lightness: 0.5,
    chroma: 0.305,
  },
  {
    hue: 279,
    lightness: 0.5,
    chroma: 0.306,
  },
  {
    hue: 280,
    lightness: 0.5,
    chroma: 0.306,
  },
  {
    hue: 281,
    lightness: 0.5,
    chroma: 0.304,
  },
  {
    hue: 282,
    lightness: 0.51,
    chroma: 0.303,
  },
  {
    hue: 283,
    lightness: 0.51,
    chroma: 0.305,
  },
  {
    hue: 284,
    lightness: 0.51,
    chroma: 0.305,
  },
  {
    hue: 285,
    lightness: 0.51,
    chroma: 0.303,
  },
  {
    hue: 286,
    lightness: 0.52,
    chroma: 0.303,
  },
  {
    hue: 287,
    lightness: 0.52,
    chroma: 0.305,
  },
  {
    hue: 288,
    lightness: 0.52,
    chroma: 0.304,
  },
  {
    hue: 289,
    lightness: 0.52,
    chroma: 0.303,
  },
  {
    hue: 290,
    lightness: 0.53,
    chroma: 0.304,
  },
  {
    hue: 291,
    lightness: 0.53,
    chroma: 0.306,
  },
  {
    hue: 292,
    lightness: 0.53,
    chroma: 0.304,
  },
  {
    hue: 293,
    lightness: 0.54,
    chroma: 0.304,
  },
  {
    hue: 294,
    lightness: 0.54,
    chroma: 0.307,
  },
  {
    hue: 295,
    lightness: 0.54,
    chroma: 0.306,
  },
  {
    hue: 296,
    lightness: 0.55,
    chroma: 0.305,
  },
  {
    hue: 297,
    lightness: 0.55,
    chroma: 0.308,
  },
  {
    hue: 298,
    lightness: 0.55,
    chroma: 0.308,
  },
  {
    hue: 299,
    lightness: 0.56,
    chroma: 0.307,
  },
  {
    hue: 300,
    lightness: 0.56,
    chroma: 0.31,
  },
  {
    hue: 301,
    lightness: 0.56,
    chroma: 0.309,
  },
  {
    hue: 302,
    lightness: 0.57,
    chroma: 0.309,
  },
  {
    hue: 303,
    lightness: 0.57,
    chroma: 0.313,
  },
  {
    hue: 304,
    lightness: 0.57,
    chroma: 0.311,
  },
  {
    hue: 305,
    lightness: 0.58,
    chroma: 0.313,
  },
  {
    hue: 306,
    lightness: 0.58,
    chroma: 0.314,
  },
  {
    hue: 307,
    lightness: 0.59,
    chroma: 0.314,
  },
  {
    hue: 308,
    lightness: 0.59,
    chroma: 0.318,
  },
  {
    hue: 309,
    lightness: 0.59,
    chroma: 0.316,
  },
  {
    hue: 310,
    lightness: 0.6,
    chroma: 0.32,
  },
  {
    hue: 311,
    lightness: 0.6,
    chroma: 0.32,
  },
  {
    hue: 312,
    lightness: 0.61,
    chroma: 0.322,
  },
  {
    hue: 313,
    lightness: 0.61,
    chroma: 0.323,
  },
  {
    hue: 314,
    lightness: 0.62,
    chroma: 0.324,
  },
  {
    hue: 315,
    lightness: 0.62,
    chroma: 0.326,
  },
  {
    hue: 316,
    lightness: 0.63,
    chroma: 0.327,
  },
  {
    hue: 317,
    lightness: 0.63,
    chroma: 0.329,
  },
  {
    hue: 318,
    lightness: 0.64,
    chroma: 0.331,
  },
  {
    hue: 319,
    lightness: 0.64,
    chroma: 0.332,
  },
  {
    hue: 320,
    lightness: 0.65,
    chroma: 0.335,
  },
  {
    hue: 321,
    lightness: 0.65,
    chroma: 0.334,
  },
  {
    hue: 322,
    lightness: 0.66,
    chroma: 0.338,
  },
  {
    hue: 323,
    lightness: 0.67,
    chroma: 0.338,
  },
  {
    hue: 324,
    lightness: 0.67,
    chroma: 0.341,
  },
  {
    hue: 325,
    lightness: 0.68,
    chroma: 0.345,
  },
  {
    hue: 326,
    lightness: 0.68,
    chroma: 0.344,
  },
  {
    hue: 327,
    lightness: 0.69,
    chroma: 0.348,
  },
  {
    hue: 328,
    lightness: 0.7,
    chroma: 0.352,
  },
  {
    hue: 329,
    lightness: 0.71,
    chroma: 0.35,
  },
  {
    hue: 330,
    lightness: 0.71,
    chroma: 0.354,
  },
  {
    hue: 331,
    lightness: 0.72,
    chroma: 0.358,
  },
  {
    hue: 332,
    lightness: 0.72,
    chroma: 0.357,
  },
  {
    hue: 333,
    lightness: 0.72,
    chroma: 0.355,
  },
  {
    hue: 334,
    lightness: 0.72,
    chroma: 0.349,
  },
  {
    hue: 335,
    lightness: 0.71,
    chroma: 0.348,
  },
  {
    hue: 336,
    lightness: 0.71,
    chroma: 0.347,
  },
  {
    hue: 337,
    lightness: 0.71,
    chroma: 0.345,
  },
  {
    hue: 338,
    lightness: 0.71,
    chroma: 0.34,
  },
  {
    hue: 339,
    lightness: 0.7,
    chroma: 0.338,
  },
  {
    hue: 340,
    lightness: 0.7,
    chroma: 0.337,
  },
  {
    hue: 341,
    lightness: 0.7,
    chroma: 0.336,
  },
  {
    hue: 342,
    lightness: 0.7,
    chroma: 0.332,
  },
  {
    hue: 343,
    lightness: 0.69,
    chroma: 0.329,
  },
  {
    hue: 344,
    lightness: 0.69,
    chroma: 0.328,
  },
  {
    hue: 345,
    lightness: 0.69,
    chroma: 0.327,
  },
  {
    hue: 346,
    lightness: 0.69,
    chroma: 0.326,
  },
  {
    hue: 347,
    lightness: 0.69,
    chroma: 0.323,
  },
  {
    hue: 348,
    lightness: 0.69,
    chroma: 0.319,
  },
  {
    hue: 349,
    lightness: 0.68,
    chroma: 0.318,
  },
  {
    hue: 350,
    lightness: 0.68,
    chroma: 0.317,
  },
  {
    hue: 351,
    lightness: 0.68,
    chroma: 0.316,
  },
  {
    hue: 352,
    lightness: 0.68,
    chroma: 0.316,
  },
  {
    hue: 353,
    lightness: 0.68,
    chroma: 0.314,
  },
  {
    hue: 354,
    lightness: 0.68,
    chroma: 0.31,
  },
  {
    hue: 355,
    lightness: 0.67,
    chroma: 0.309,
  },
  {
    hue: 356,
    lightness: 0.67,
    chroma: 0.308,
  },
  {
    hue: 357,
    lightness: 0.67,
    chroma: 0.307,
  },
  {
    hue: 358,
    lightness: 0.67,
    chroma: 0.306,
  },
  {
    hue: 359,
    lightness: 0.67,
    chroma: 0.306,
  },
  {
    hue: 360,
    lightness: 0.67,
    chroma: 0.305,
  },
];

export const calculateApcaScore = (
  { r: fgR, g: fgG, b: fgB }: RGB,
  { r: bgR, g: bgG, b: bgB }: RGB,
  colorSpace: FigmaDocumentColorSpace
): number => {
  if (colorSpace === 'DISPLAY_P3') {
    const fgY = displayP3toY([fgR, fgG, fgB]);
    const bgY = displayP3toY([bgR, bgG, bgB]);
    const contrast = APCAcontrast(fgY, bgY);

    return Math.round(Number(contrast));
  } else {
    return Math.round(
      Number(APCAcontrast(sRGBtoY([fgR, fgG, fgB]), sRGBtoY([bgR, bgG, bgB])))
    );
  }
};

export const createApcaMatrix = (
  palette: Palette,
  colorspace: FigmaDocumentColorSpace
): ApcaMatrix => {
  const matrix: number[][] = [];
  const swatches = palette.swatches;
  swatches.forEach((bg) => {
    const column: number[] = [];
    swatches.forEach((fg) => {
      column.push(
        calculateApcaScore(
          colorspace == 'DISPLAY_P3' ? fg.dispP3 : fg.sRgb,
          colorspace == 'DISPLAY_P3' ? bg.dispP3 : bg.sRgb,
          colorspace
        )
      );
    });
    matrix.push(column);
  });
  const out = {
    palette,
    matrix,
  };
  return out;
};
