/// <reference types="@figma/plugin-typings" />

import { Palette, ApcaMatrix } from '../types/paletteTypes';
import {
  LIGHTNESS_STEP,
  CHROMA_STEP,
  HUE_STEP,
  RGB_FLOAT_PRECISION,
} from '../constants';
import { quantize } from '../utils/numberUtils';

const PX = 12;
const WIDTH = 250;
const HEIGHT = 900; // 742

const PALETTE_PX = 48;
const PALETTE_PY = 48;
const PALETTE_GX = 24;
const PALETTE_GY = 24;
const SWATCH_W = 200;
const SWATCH_H = 200;
const INFO_PX = 16;
const INFO_PY = 16;
const INFO_GY = 4;
const INFO_FONTSIZE = 12;
const INFO_LINEHEIGHT = 16;
const IDX_FONTSIZE = 56;
const IDX_OFFSET_X = 12;
const IDX_OFFSET_Y = 20;

let isFontLoaded = false;
const ensureFontLoaded = async () => {
  if (!isFontLoaded) {
    await figma.loadFontAsync({ family: 'Roboto Mono', style: 'Medium' });
    await figma.loadFontAsync({ family: 'Roboto Condensed', style: 'Bold' });
    isFontLoaded = true;
  }
};

figma.showUI(__html__, {
  themeColors: true,
  width: WIDTH + 2 * PX,
  height: HEIGHT,
});
figma.ui.postMessage({ type: 'size', width: WIDTH, height: HEIGHT, px: PX });

const colorSpace = figma.root.documentColorProfile;
figma.ui.postMessage({ type: 'colorSpace', colorSpace: colorSpace });

// type MsgType =
//   | {
//       type: string;
//       palette: Palette;
//     }
//   | {
//       type: string;
//       apcaMatrix: ApcaMatrix;
//     };

// figma.ui.onmessage = async (msg: MsgType) => {
//   if (msg.type === 'create-palette' && 'palette' in msg) {
//     await ensureFontLoaded();

//     //     const palette = msg.palette;

//     //     const nodes: SceneNode[] = [];
//     //     const paletteFrame = figma.createFrame();
//     //     paletteFrame.name = `OKP-step${palette.swatchStep}_l${quantize(
//     //       100 * palette.peakLightness,
//     //       1
//     //     )}_c${quantize(100 * palette.peakChroma, 0.1)}_h${quantize(
//     //       palette.hues.from,
//     //       1
//     //     )}-${quantize(palette.hues.to, 1)}`;
//     //     const { x: centerX, y: centerY } = figma.viewport.center;
//     //     paletteFrame.x = centerX;
//     //     paletteFrame.y = centerY;
//     //     paletteFrame.resize(
//     //       2 * PALETTE_PX +
//     //         palette.swatches.length * SWATCH_W +
//     //         (palette.swatches.length - 1) * PALETTE_GX,
//     //       2 * PALETTE_PY + SWATCH_H
//     //     );
//     //     paletteFrame.fills = [
//     //       {
//     //         type: 'SOLID',
//     //         color: { r: 1, g: 1, b: 1 },
//     //       },
//     //     ];

//     //     palette.swatches.forEach((aSwatch, idx) => {
//     //       const swatchFrame = figma.createFrame();
//     //       paletteFrame.appendChild(swatchFrame);
//     //       swatchFrame.name = `Swatch-${idx * palette.swatchStep}`;
//     //       swatchFrame.layoutMode = 'VERTICAL';
//     //       swatchFrame.layoutSizingHorizontal = 'FIXED';
//     //       swatchFrame.layoutSizingVertical = 'FIXED';
//     //       swatchFrame.x = PALETTE_PX + idx * (SWATCH_W + PALETTE_GX);
//     //       swatchFrame.y = PALETTE_PY;
//     //       swatchFrame.resize(SWATCH_W, SWATCH_H);
//     //       swatchFrame.fills =
//     //         colorSpace === 'DISPLAY_P3'
//     //           ? [
//     //               {
//     //                 type: 'SOLID',
//     //                 color: {
//     //                   r: aSwatch.dispP3.r,
//     //                   g: aSwatch.dispP3.g,
//     //                   b: aSwatch.dispP3.b,
//     //                 },
//     //               },
//     //             ]
//     //           : [
//     //               {
//     //                 type: 'SOLID',
//     //                 color: {
//     //                   r: aSwatch.sRgb.r,
//     //                   g: aSwatch.sRgb.g,
//     //                   b: aSwatch.sRgb.b,
//     //                 },
//     //               },
//     //             ];

//     //       const infoFrame = figma.createFrame();
//     //       swatchFrame.appendChild(infoFrame);
//     //       infoFrame.name = 'info';
//     //       infoFrame.layoutMode = 'VERTICAL';
//     //       infoFrame.layoutSizingHorizontal = 'FILL';
//     //       infoFrame.layoutSizingVertical = 'FILL';
//     //       infoFrame.paddingTop = INFO_PY;
//     //       infoFrame.paddingBottom = INFO_PY;
//     //       infoFrame.paddingLeft = INFO_PX;
//     //       infoFrame.paddingRight = INFO_PX;
//     //       infoFrame.itemSpacing = INFO_GY;
//     //       infoFrame.fills = [];

//     //       const lightnessText = figma.createText();
//     //       swatchFrame.appendChild(lightnessText);
//     //       lightnessText.name = '#';
//     //       lightnessText.fontName = { family: 'Roboto Condensed', style: 'Bold' };
//     //       lightnessText.fontSize = IDX_FONTSIZE;
//     //       lightnessText.lineHeight = { value: IDX_FONTSIZE, unit: 'PIXELS' };
//     //       lightnessText.characters = `${idx * palette.swatchStep}`;
//     //       lightnessText.layoutPositioning = 'ABSOLUTE';
//     //       lightnessText.x = SWATCH_W - lightnessText.width + IDX_OFFSET_X;
//     //       lightnessText.y = SWATCH_H - lightnessText.height + IDX_OFFSET_Y;
//     //       lightnessText.fills = [
//     //         {
//     //           type: 'SOLID',
//     //           color:
//     //             idx < palette.swatches.length / 2
//     //               ? { r: 1, g: 1, b: 1 }
//     //               : { r: 0, g: 0, b: 0 },
//     //         },
//     //       ];

//     //       const okLChText = figma.createText();
//     //       infoFrame.appendChild(okLChText);
//     //       let p3RGBText;
//     //       if (colorSpace === 'DISPLAY_P3') {
//     //         p3RGBText = figma.createText();
//     //         infoFrame.appendChild(p3RGBText);
//     //       }
//     //       const hexText = figma.createText();
//     //       infoFrame.appendChild(hexText);
//     //       const gamutText = figma.createText();
//     //       infoFrame.appendChild(gamutText);

//     //       infoFrame.children.forEach((child) => {
//     //         if (child.type === 'TEXT') {
//     //           const textNode = child as TextNode;
//     //           textNode.fontName = { family: 'Roboto Mono', style: 'Medium' };
//     //           textNode.fontSize = INFO_FONTSIZE;
//     //           textNode.lineHeight = { value: INFO_LINEHEIGHT, unit: 'PIXELS' };
//     //           textNode.fills = [
//     //             {
//     //               type: 'SOLID',
//     //               color:
//     //                 idx < palette.swatches.length / 2
//     //                   ? { r: 1, g: 1, b: 1 }
//     //                   : { r: 0, g: 0, b: 0 },
//     //             },
//     //           ];
//     //         }
//     //       });

//     //       okLChText.name = 'oklch';
//     //       okLChText.characters =
//     //         colorSpace === 'DISPLAY_P3'
//     //           ? `oklch(${quantize(
//     //               aSwatch.dispP3Oklch.l,
//     //               LIGHTNESS_STEP
//     //             )} ${quantize(aSwatch.dispP3Oklch.c, CHROMA_STEP)} ${quantize(
//     //               aSwatch.dispP3Oklch.h,
//     //               HUE_STEP
//     //             )})`
//     //           : `oklch(${quantize(aSwatch.sRgbOklch.l, LIGHTNESS_STEP)} ${quantize(
//     //               aSwatch.sRgbOklch.c,
//     //               CHROMA_STEP
//     //             )} ${quantize(aSwatch.sRgbOklch.h, HUE_STEP)})`;

//     //       if (colorSpace === 'DISPLAY_P3' && p3RGBText) {
//     //         p3RGBText.name = 'displayP3-rgb';
//     //         p3RGBText.fontName = { family: 'Roboto Mono', style: 'Medium' };
//     //         p3RGBText.characters = `color(display-p3
//     //   ${quantize(aSwatch.dispP3.r, RGB_FLOAT_PRECISION)}
//     //   ${quantize(aSwatch.dispP3.g, RGB_FLOAT_PRECISION)}
//     //   ${quantize(aSwatch.dispP3.b, RGB_FLOAT_PRECISION)}
//     // )`;
//     //       }

//     //       hexText.name = 'hex';
//     //       hexText.characters = `#${
//     //         colorSpace === 'DISPLAY_P3' ? aSwatch.dispP3Hex : aSwatch.sRgbHex
//     //       }`;

//     //       gamutText.name = 'gamut';
//     //       gamutText.characters = aSwatch.gamut;
//     //     });

//     //     figma.currentPage.appendChild(paletteFrame);
//     //     nodes.push(paletteFrame);
//   } else if (msg.type === 'create-matrix' && 'apcaMatrix' in msg) {
//     console.log('MATRIX');
//     await ensureFontLoaded();
//     const apcaMatrix = msg.apcaMatrix;
//     const palette = apcaMatrix.palette;
//     const matrix = apcaMatrix.matrix;
//   }
// };

//     const nodes: SceneNode[] = [];
//     const paletteFrame = figma.createFrame();
//     paletteFrame.name = `OKP-matrix-step${palette.swatchStep}_l${quantize(
//       100 * palette.peakLightness,
//       1
//     )}_c${quantize(100 * palette.peakChroma, 0.1)}_h${quantize(
//       palette.hues.from,
//       1
//     )}-${quantize(palette.hues.to, 1)}`;
//     const { x: centerX, y: centerY } = figma.viewport.center;
//     paletteFrame.x = centerX + SWATCH_H + 2 * PALETTE_PY;
//     paletteFrame.y = centerY;
//     paletteFrame.resize(
//       2 * PALETTE_PX +
//         (100 / palette.swatchStep + 1) * SWATCH_W +
//         (100 / palette.swatchStep) * PALETTE_GX,
//       2 * PALETTE_PY +
//         +(100 / palette.swatchStep + 1) * SWATCH_H +
//         (100 / palette.swatchStep) * PALETTE_GY
//     );
//     paletteFrame.fills = [
//       {
//         type: 'SOLID',
//         color: { r: 1, g: 1, b: 1 },
//       },
//     ];

//     matrix.forEach((bg, bgIdx) => {
//       bg.forEach((fg, fgIdx) => {
//         const swatchFrame = figma.createFrame();
//         paletteFrame.appendChild(swatchFrame);
//         swatchFrame.name = `bg-${bgIdx * palette.swatchStep}_fg-${
//           fgIdx * palette.swatchStep
//         }`;
//         swatchFrame.layoutMode = 'VERTICAL';
//         swatchFrame.layoutSizingHorizontal = 'FIXED';
//         swatchFrame.layoutSizingVertical = 'FIXED';
//         swatchFrame.x = PALETTE_PX + bgIdx * (SWATCH_W + PALETTE_GX);
//         swatchFrame.y = PALETTE_PY + fgIdx * (SWATCH_H + PALETTE_GY);
//         swatchFrame.resize(SWATCH_W, SWATCH_H);
//         swatchFrame.fills =
//           colorSpace === 'DISPLAY_P3'
//             ? [
//                 {
//                   type: 'SOLID',
//                   color: {
//                     r: palette.swatches[bgIdx].dispP3.r,
//                     g: palette.swatches[bgIdx].dispP3.g,
//                     b: palette.swatches[bgIdx].dispP3.b,
//                   },
//                 },
//               ]
//             : [
//                 {
//                   type: 'SOLID',
//                   color: {
//                     r: palette.swatches[bgIdx].sRgb.r,
//                     g: palette.swatches[bgIdx].sRgb.g,
//                     b: palette.swatches[bgIdx].sRgb.b,
//                   },
//                 },
//               ];
//         if (fg < 30 && fg > -30) swatchFrame.opacity = 0;
//         const lightnessText = figma.createText();
//         swatchFrame.appendChild(lightnessText);
//         lightnessText.name = 'APCA Contrast';
//         lightnessText.fontName = { family: 'Roboto Condensed', style: 'Bold' };
//         lightnessText.fontSize = IDX_FONTSIZE;
//         lightnessText.lineHeight = { value: IDX_FONTSIZE, unit: 'PIXELS' };
//         lightnessText.characters = `${fg}`;
//         lightnessText.layoutPositioning = 'ABSOLUTE';
//         lightnessText.x = SWATCH_W * 0.5 - lightnessText.width * 0.5;
//         lightnessText.y = SWATCH_H * 0.5 - lightnessText.height * 0.5;
//         lightnessText.fills =
//           colorSpace === 'DISPLAY_P3'
//             ? [
//                 {
//                   type: 'SOLID',
//                   color: {
//                     r: palette.swatches[fgIdx].dispP3.r,
//                     g: palette.swatches[fgIdx].dispP3.g,
//                     b: palette.swatches[fgIdx].dispP3.b,
//                   },
//                 },
//               ]
//             : [
//                 {
//                   type: 'SOLID',
//                   color: {
//                     r: palette.swatches[fgIdx].sRgb.r,
//                     g: palette.swatches[fgIdx].sRgb.g,
//                     b: palette.swatches[fgIdx].sRgb.b,
//                   },
//                 },
//               ];
//       });
//     });

//     figma.currentPage.appendChild(paletteFrame);
//     nodes.push(paletteFrame);
//   }
// };
