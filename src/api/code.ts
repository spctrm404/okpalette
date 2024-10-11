/// <reference types="@figma/plugin-typings" />

import { FigmaMessage } from '../types/figmaTypes';
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

const PALETTE_PX = 24;
const PALETTE_PY = 24;
const PALETTE_GX = 24;
const PALETTE_GY = 24;
const SWATCH_W = 128;
const SWATCH_H = 128;
const INFO_PX = 8;
const INFO_PY = 6;
const INFO_GY = 4;
const INFO_FONTSIZE = 10;
const INFO_LINEHEIGHT = 12;
const IDX_FONTSIZE = 56;
const IDX_OFFSET_X = 12;
const IDX_OFFSET_Y = 20;

const fontNames = [
  { family: 'Roboto Mono', style: 'Regular' },
  { family: 'Roboto Condensed', style: 'Bold' },
];

figma.showUI(__html__, {
  themeColors: true,
  width: WIDTH + 2 * PX,
  height: HEIGHT,
});
figma.ui.postMessage(<FigmaMessage>{
  type: 'size',
  data: { width: WIDTH, height: HEIGHT, px: PX },
});

const colorSpace = figma.root.documentColorProfile;
figma.ui.postMessage(<FigmaMessage>{
  type: 'colorSpace',
  data: { colorSpace: colorSpace },
});

const createPalette = (palette: Palette) => {
  const paletteFrame = figma.createFrame();
  paletteFrame.name = `OKP_step${palette.swatchStep}_l${quantize(
    100 * palette.peakLightness,
    1
  )}_c${quantize(100 * palette.peakChroma, 0.1)}_h${quantize(
    palette.hues.from,
    1
  )}-${quantize(palette.hues.to, 1)}`;
  const { x: centerX, y: centerY } = figma.viewport.center;
  paletteFrame.x = Math.floor(centerX);
  paletteFrame.y = Math.floor(centerY);
  paletteFrame.resize(
    2 * PALETTE_PX +
      palette.swatches.length * SWATCH_W +
      (palette.swatches.length - 1) * PALETTE_GX,
    2 * PALETTE_PY + SWATCH_H
  );
  paletteFrame.fills = [
    {
      type: 'SOLID',
      color: { r: 1, g: 1, b: 1 },
    },
  ];

  palette.swatches.forEach((aSwatch, idx) => {
    const swatchFrame = figma.createFrame();
    paletteFrame.appendChild(swatchFrame);
    swatchFrame.name = `Swatch-${idx * palette.swatchStep}`;
    swatchFrame.layoutMode = 'VERTICAL';
    swatchFrame.layoutSizingHorizontal = 'FIXED';
    swatchFrame.layoutSizingVertical = 'FIXED';
    swatchFrame.x = PALETTE_PX + idx * (SWATCH_W + PALETTE_GX);
    swatchFrame.y = PALETTE_PY;
    swatchFrame.resize(SWATCH_W, SWATCH_H);
    swatchFrame.fills =
      colorSpace === 'DISPLAY_P3'
        ? [
            {
              type: 'SOLID',
              color: {
                r: aSwatch.dispP3.r,
                g: aSwatch.dispP3.g,
                b: aSwatch.dispP3.b,
              },
            },
          ]
        : [
            {
              type: 'SOLID',
              color: {
                r: aSwatch.sRgb.r,
                g: aSwatch.sRgb.g,
                b: aSwatch.sRgb.b,
              },
            },
          ];

    const lightnessText = figma.createText();
    swatchFrame.appendChild(lightnessText);
    lightnessText.name = '#';
    lightnessText.fontName = fontNames[1];
    lightnessText.fontSize = IDX_FONTSIZE;
    lightnessText.lineHeight = { value: IDX_FONTSIZE, unit: 'PIXELS' };
    lightnessText.characters = `${idx * palette.swatchStep}`;
    lightnessText.layoutPositioning = 'ABSOLUTE';
    lightnessText.x = SWATCH_W - lightnessText.width + IDX_OFFSET_X;
    lightnessText.y = SWATCH_H - lightnessText.height + IDX_OFFSET_Y;
    lightnessText.constraints = {
      horizontal: 'MAX',
      vertical: 'MAX',
    };
    lightnessText.fills = [
      {
        type: 'SOLID',
        color:
          idx < palette.swatches.length / 2
            ? { r: 1, g: 1, b: 1 }
            : { r: 0, g: 0, b: 0 },
      },
    ];

    const infoFrame = figma.createFrame();
    swatchFrame.appendChild(infoFrame);
    infoFrame.name = 'info';
    infoFrame.layoutMode = 'VERTICAL';
    infoFrame.layoutSizingHorizontal = 'FILL';
    infoFrame.layoutSizingVertical = 'FILL';
    infoFrame.paddingTop = INFO_PY;
    infoFrame.paddingBottom = INFO_PY;
    infoFrame.paddingLeft = INFO_PX;
    infoFrame.paddingRight = INFO_PX;
    infoFrame.itemSpacing = INFO_GY;
    infoFrame.fills = [];

    const okLChText = figma.createText();
    infoFrame.appendChild(okLChText);
    let p3RGBText;
    if (colorSpace === 'DISPLAY_P3') {
      p3RGBText = figma.createText();
      infoFrame.appendChild(p3RGBText);
    }
    const hexText = figma.createText();
    infoFrame.appendChild(hexText);
    const gamutText = figma.createText();
    infoFrame.appendChild(gamutText);

    infoFrame.children.forEach((child) => {
      if (child.type === 'TEXT') {
        const textNode = child as TextNode;
        textNode.fontName = fontNames[0];
        textNode.fontSize = INFO_FONTSIZE;
        textNode.lineHeight = { value: INFO_LINEHEIGHT, unit: 'PIXELS' };
        textNode.fills = [
          {
            type: 'SOLID',
            color:
              idx < palette.swatches.length / 2
                ? { r: 1, g: 1, b: 1 }
                : { r: 0, g: 0, b: 0 },
          },
        ];
      }
    });

    okLChText.name = 'oklch';
    okLChText.characters =
      colorSpace === 'DISPLAY_P3'
        ? `oklch(${quantize(aSwatch.dispP3Oklch.l, LIGHTNESS_STEP)} ${quantize(
            aSwatch.dispP3Oklch.c,
            CHROMA_STEP
          )} ${quantize(aSwatch.dispP3Oklch.h, HUE_STEP)})`
        : `oklch(${quantize(aSwatch.sRgbOklch.l, LIGHTNESS_STEP)} ${quantize(
            aSwatch.sRgbOklch.c,
            CHROMA_STEP
          )} ${quantize(aSwatch.sRgbOklch.h, HUE_STEP)})`;

    if (colorSpace === 'DISPLAY_P3' && p3RGBText) {
      p3RGBText.name = 'displayP3-rgb';
      p3RGBText.fontName = fontNames[0];
      p3RGBText.characters = `color(display-p3
${quantize(aSwatch.dispP3.r, RGB_FLOAT_PRECISION)}
${quantize(aSwatch.dispP3.g, RGB_FLOAT_PRECISION)}
${quantize(aSwatch.dispP3.b, RGB_FLOAT_PRECISION)}
)`;
    }

    hexText.name = 'hex';
    hexText.characters = `#${
      colorSpace === 'DISPLAY_P3' ? aSwatch.dispP3Hex : aSwatch.sRgbHex
    }`;

    gamutText.name = 'gamut';
    gamutText.characters = aSwatch.gamut;
  });
  return paletteFrame;
};

const createMatrix = (apcaMatrix: ApcaMatrix) => {
  const palette = apcaMatrix.palette;
  const matrix = apcaMatrix.matrix;
  const matrixFrame = figma.createFrame();
  matrixFrame.name = `OKP-Matrix_step${palette.swatchStep}_l${quantize(
    100 * palette.peakLightness,
    1
  )}_c${quantize(100 * palette.peakChroma, 0.1)}_h${quantize(
    palette.hues.from,
    1
  )}-${quantize(palette.hues.to, 1)}`;
  const { x: centerX, y: centerY } = figma.viewport.center;
  matrixFrame.x = Math.floor(centerX);
  matrixFrame.y = Math.floor(centerY) + 2 * (2 * PALETTE_PY + SWATCH_H);
  matrixFrame.resize(
    2 * PALETTE_PX +
      (100 / palette.swatchStep + 1) * SWATCH_W +
      (100 / palette.swatchStep) * PALETTE_GX,
    2 * PALETTE_PY +
      +(100 / palette.swatchStep + 1) * SWATCH_H +
      (100 / palette.swatchStep) * PALETTE_GY
  );
  matrixFrame.fills = [
    {
      type: 'SOLID',
      color: { r: 1, g: 1, b: 1 },
    },
  ];

  matrix.forEach((aColumn, columnIdx) => {
    aColumn.forEach((anApcaContrast, rowIdx) => {
      const elementFrame = figma.createFrame();
      matrixFrame.appendChild(elementFrame);
      elementFrame.name = `bg-${columnIdx * palette.swatchStep}_fg-${
        rowIdx * palette.swatchStep
      }_${Math.abs(anApcaContrast)}`;
      elementFrame.layoutMode = 'VERTICAL';
      elementFrame.layoutSizingHorizontal = 'FIXED';
      elementFrame.layoutSizingVertical = 'FIXED';
      elementFrame.x = PALETTE_PX + columnIdx * (SWATCH_W + PALETTE_GX);
      elementFrame.y = PALETTE_PY + rowIdx * (SWATCH_H + PALETTE_GY);
      elementFrame.resize(SWATCH_W, SWATCH_H);
      elementFrame.fills =
        colorSpace === 'DISPLAY_P3'
          ? [
              {
                type: 'SOLID',
                color: {
                  r: palette.swatches[columnIdx].dispP3.r,
                  g: palette.swatches[columnIdx].dispP3.g,
                  b: palette.swatches[columnIdx].dispP3.b,
                },
              },
            ]
          : [
              {
                type: 'SOLID',
                color: {
                  r: palette.swatches[columnIdx].sRgb.r,
                  g: palette.swatches[columnIdx].sRgb.g,
                  b: palette.swatches[columnIdx].sRgb.b,
                },
              },
            ];
      if (anApcaContrast < 30 && anApcaContrast > -30)
        elementFrame.opacity = 0.05;
      const lightnessText = figma.createText();
      elementFrame.appendChild(lightnessText);
      lightnessText.name = 'APCA Contrast';
      lightnessText.fontName = fontNames[1];
      lightnessText.fontSize = IDX_FONTSIZE;
      lightnessText.lineHeight = { value: IDX_FONTSIZE, unit: 'PIXELS' };
      lightnessText.characters = `${Math.abs(anApcaContrast)}`;
      lightnessText.layoutPositioning = 'ABSOLUTE';
      lightnessText.x = SWATCH_W * 0.5 - lightnessText.width * 0.5;
      lightnessText.y = SWATCH_H * 0.5 - lightnessText.height * 0.5;
      lightnessText.fills =
        colorSpace === 'DISPLAY_P3'
          ? [
              {
                type: 'SOLID',
                color: {
                  r: palette.swatches[rowIdx].dispP3.r,
                  g: palette.swatches[rowIdx].dispP3.g,
                  b: palette.swatches[rowIdx].dispP3.b,
                },
              },
            ]
          : [
              {
                type: 'SOLID',
                color: {
                  r: palette.swatches[rowIdx].sRgb.r,
                  g: palette.swatches[rowIdx].sRgb.g,
                  b: palette.swatches[rowIdx].sRgb.b,
                },
              },
            ];
    });
  });

  return matrixFrame;
};

figma.ui.onmessage = ({ type, data }: FigmaMessage) => {
  if (type === 'create-apca-matrix') {
    Promise.all(fontNames.map((fontName) => figma.loadFontAsync(fontName)))
      .then(() => {
        const apcaMatrix = data.apcaMatrix as ApcaMatrix;
        const palette = apcaMatrix.palette;

        const nodes: SceneNode[] = [];

        const paletteFrame = createPalette(palette);
        figma.currentPage.appendChild(paletteFrame);
        const matrixFrame = createMatrix(apcaMatrix);
        figma.currentPage.appendChild(matrixFrame);

        nodes.push(paletteFrame);
      })
      .catch((err) => {
        console.error('Error on loading fonts: ', err);
      });
  }
};

// figma.ui.onmessage = async (msg: MsgType) => {
//   if (msg.type === 'create-palette' && 'palette' in msg) {
//     await ensureFontLoaded();

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
