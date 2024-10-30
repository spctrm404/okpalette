// check constants and formatDigits

import { Matrix } from '../types/commonTypes';
import { Palette, ApcaMatrix } from '../types/paletteTypes';
import { FigmaMessage } from '../types/figmaTypes';

import {
  LIGHTNESS_STEP,
  CHROMA_STEP,
  HUE_STEP,
  RGB_FLOAT_PRECISION,
} from '../constants';

import { formatDigits } from '../utils/stringUtils';

const PX = 12;
const WIDTH = 200;
const HEIGHT = 526;

const PALETTE_PX = 24;
const PALETTE_PY = 24;
const PALETTE_GX = 24;
const PALETTE_GY = 24;
const SWATCH_W = 144;
const SWATCH_H = 144;
const INFO_PX = 8;
const INFO_PY = 8;
const INFO_GY = 8;
const INFO_FONTSIZE = 10;
const INFO_LINEHEIGHT = 12;
const IDX_FONTSIZE = 56;
const IDX_OFFSET_X = 12;
const IDX_OFFSET_Y = 12;

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
  // paletteFrame
  const paletteFrame = figma.createFrame();
  paletteFrame.name = `OKP_step${palette.swatchStep}_l${formatDigits(
    100 * palette.peakLightness,
    0,
    0
  )}_c${formatDigits(100 * palette.peakChroma, 0, 1)}_h${formatDigits(
    palette.hues.from,
    0,
    0
  )}-${formatDigits(palette.hues.to, 0, 0)}`;
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
  // swatchFrame
  palette.swatches.forEach((aSwatch, idx) => {
    const swatchFrame = figma.createFrame();
    paletteFrame.appendChild(swatchFrame);
    swatchFrame.name = `swatch-${idx * palette.swatchStep}`;
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
    // lightnessText
    const lightnessText = figma.createText();
    swatchFrame.appendChild(lightnessText);
    lightnessText.name = '#';
    lightnessText.fontName = fontNames[1];
    lightnessText.fontSize = IDX_FONTSIZE;
    lightnessText.lineHeight = { value: IDX_FONTSIZE, unit: 'PIXELS' };
    lightnessText.characters = `${idx * palette.swatchStep}`;
    lightnessText.leadingTrim = 'CAP_HEIGHT';
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
    // infoFrame
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
    // infoFrame.children
    const okLChText = figma.createText();
    infoFrame.appendChild(okLChText);
    let p3RGBText;
    if (colorSpace === 'DISPLAY_P3') {
      p3RGBText = figma.createText();
      infoFrame.appendChild(p3RGBText);
    }
    const hexText = figma.createText();
    infoFrame.appendChild(hexText);
    let dispP3HexText;
    if (colorSpace === 'DISPLAY_P3') {
      dispP3HexText = figma.createText();
      infoFrame.appendChild(dispP3HexText);
    }
    const gamutText = figma.createText();
    infoFrame.appendChild(gamutText);
    infoFrame.children.forEach((child) => {
      if (child.type === 'TEXT') {
        const textNode = child as TextNode;
        textNode.fontName = fontNames[0];
        textNode.fontSize = INFO_FONTSIZE;
        textNode.lineHeight = { value: INFO_LINEHEIGHT, unit: 'PIXELS' };
        textNode.leadingTrim = 'CAP_HEIGHT';
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
    // okLChText
    okLChText.name = 'oklch';
    okLChText.characters =
      colorSpace === 'DISPLAY_P3'
        ? `oklch(${formatDigits(aSwatch.dispP3Oklch.l, -1, 2)} ${formatDigits(
            aSwatch.dispP3Oklch.c,
            -1,
            3
          )} ${formatDigits(aSwatch.dispP3Oklch.h, 0, 0)})`
        : `oklch(${formatDigits(aSwatch.sRgbOklch.l, -1, 2)} ${formatDigits(
            aSwatch.sRgbOklch.c,
            -1,
            3
          )} ${formatDigits(aSwatch.sRgbOklch.h, 0, 0)})`;
    if (p3RGBText) {
      p3RGBText.name = 'displayP3-rgb';
      p3RGBText.fontName = fontNames[0];
      p3RGBText.characters = `color(display-p3
${formatDigits(aSwatch.dispP3.r, 1, 6)}
${formatDigits(aSwatch.dispP3.g, 1, 6)}
${formatDigits(aSwatch.dispP3.b, 1, 6)}
)`;
    }
    // hexText
    hexText.name = 'sRGB-hex';
    hexText.characters = `#${aSwatch.sRgbHex}`;
    // dispP3HexText
    if (dispP3HexText) {
      dispP3HexText.name = 'displayP3-hex';
      dispP3HexText.characters = `#${aSwatch.dispP3Hex}`;
      dispP3HexText.visible = false;
    }
    // gamut
    gamutText.name = 'gamut';
    let gamut;
    if (colorSpace === 'DISPLAY_P3') {
      if (aSwatch.gamut === 'sRGB') {
        gamut = aSwatch.gamut;
      } else if (aSwatch.gamut === 'Display P3') {
        gamut = aSwatch.gamut;
      } else {
        gamut = 'Display P3 (Clamped)';
      }
    } else {
      if (aSwatch.gamut === 'sRGB') {
        gamut = aSwatch.gamut;
      } else {
        gamut = 'sRGB (Clamped)';
      }
    }
    gamutText.characters = gamut;
  });
  return paletteFrame;
};

const createMatrix = (apcaMatrix: ApcaMatrix) => {
  const palette = apcaMatrix.palette;
  const matrix = Matrix.fromSerialized(apcaMatrix.matrix);
  // matrixFrame
  const matrixFrame = figma.createFrame();
  matrixFrame.name = `OKP-Matrix_step${palette.swatchStep}_l-${formatDigits(
    100 * palette.peakLightness,
    0,
    0
  )}_c-${formatDigits(100 * palette.peakChroma, 0, 1)}_h-${formatDigits(
    palette.hues.from,
    0,
    0
  )}-${formatDigits(palette.hues.to, 0, 0)}`;
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
  // elementFrame
  for (let matrixY = 0; matrixY < matrix.getHeight(); matrixY++) {
    for (let matrixX = 0; matrixX < matrix.getWidth(); matrixX++) {
      if (matrixY !== matrixX) {
        const anApcaContrast = matrix.getValueByCoord({
          x: matrixX,
          y: matrixY,
        });
        const elementFrame = figma.createFrame();
        matrixFrame.appendChild(elementFrame);
        elementFrame.name = `bg-${matrixX * palette.swatchStep}_fg-${
          matrixY * palette.swatchStep
        }_Lc-${Math.abs(anApcaContrast)}`;
        elementFrame.x = PALETTE_PX + matrixX * (SWATCH_W + PALETTE_GX);
        elementFrame.y = PALETTE_PY + matrixY * (SWATCH_H + PALETTE_GY);
        elementFrame.resize(SWATCH_W, SWATCH_H);
        elementFrame.fills =
          colorSpace === 'DISPLAY_P3'
            ? [
                {
                  type: 'SOLID',
                  color: {
                    r: palette.swatches[matrixX].dispP3.r,
                    g: palette.swatches[matrixX].dispP3.g,
                    b: palette.swatches[matrixX].dispP3.b,
                  },
                },
              ]
            : [
                {
                  type: 'SOLID',
                  color: {
                    r: palette.swatches[matrixX].sRgb.r,
                    g: palette.swatches[matrixX].sRgb.g,
                    b: palette.swatches[matrixX].sRgb.b,
                  },
                },
              ];
        if (anApcaContrast > -15 && anApcaContrast < 15) {
          elementFrame.bottomLeftRadius = 1 * Math.min(SWATCH_W, SWATCH_H);
          elementFrame.topRightRadius = 1 * Math.min(SWATCH_W, SWATCH_H);
        } else if (anApcaContrast > -30 && anApcaContrast < 30) {
          elementFrame.bottomLeftRadius = 0.5 * Math.min(SWATCH_W, SWATCH_H);
          elementFrame.topRightRadius = 0.5 * Math.min(SWATCH_W, SWATCH_H);
        }
        // bgText
        const bgText = figma.createText();
        elementFrame.appendChild(bgText);
        bgText.name = 'bg';
        bgText.fontName = fontNames[0];
        bgText.fontSize = INFO_FONTSIZE;
        bgText.lineHeight = { value: INFO_FONTSIZE, unit: 'PIXELS' };
        bgText.characters = `${matrixX * palette.swatchStep}`;
        bgText.leadingTrim = 'CAP_HEIGHT';
        bgText.x = INFO_PX;
        bgText.y = INFO_PY;
        bgText.constraints = {
          horizontal: 'MIN',
          vertical: 'MIN',
        };
        bgText.fills = [
          {
            type: 'SOLID',
            color:
              matrixX < palette.swatches.length / 2
                ? { r: 1, g: 1, b: 1 }
                : { r: 0, g: 0, b: 0 },
          },
        ];
        // fgText
        const fgText = figma.createText();
        elementFrame.appendChild(fgText);
        fgText.name = 'fg';
        fgText.fontName = fontNames[0];
        fgText.fontSize = INFO_FONTSIZE;
        fgText.lineHeight = { value: INFO_FONTSIZE, unit: 'PIXELS' };
        fgText.characters = `${matrixY * palette.swatchStep}`;
        fgText.leadingTrim = 'CAP_HEIGHT';
        fgText.x = SWATCH_W - fgText.width - INFO_PX;
        fgText.y = SWATCH_H - fgText.height - INFO_PY;
        fgText.constraints = {
          horizontal: 'MAX',
          vertical: 'MAX',
        };
        fgText.fills = [
          {
            type: 'SOLID',
            color:
              matrixX < palette.swatches.length / 2
                ? { r: 1, g: 1, b: 1 }
                : { r: 0, g: 0, b: 0 },
          },
        ];
        // lightnessText
        const lightnessText = figma.createText();
        elementFrame.appendChild(lightnessText);
        lightnessText.name = 'lc';
        lightnessText.fontName = fontNames[1];
        lightnessText.fontSize = IDX_FONTSIZE;
        lightnessText.lineHeight = { value: IDX_FONTSIZE, unit: 'PIXELS' };
        lightnessText.characters = `${Math.abs(anApcaContrast)}`;
        lightnessText.leadingTrim = 'CAP_HEIGHT';
        lightnessText.x = SWATCH_W * 0.5 - lightnessText.width * 0.5;
        lightnessText.y = SWATCH_H * 0.5 - lightnessText.height * 0.5;
        lightnessText.constraints = {
          horizontal: 'CENTER',
          vertical: 'CENTER',
        };
        lightnessText.fills =
          colorSpace === 'DISPLAY_P3'
            ? [
                {
                  type: 'SOLID',
                  color: {
                    r: palette.swatches[matrixY].dispP3.r,
                    g: palette.swatches[matrixY].dispP3.g,
                    b: palette.swatches[matrixY].dispP3.b,
                  },
                },
              ]
            : [
                {
                  type: 'SOLID',
                  color: {
                    r: palette.swatches[matrixY].sRgb.r,
                    g: palette.swatches[matrixY].sRgb.g,
                    b: palette.swatches[matrixY].sRgb.b,
                  },
                },
              ];
      }
    }
  }
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
  } else if (type === 'create-palette') {
    Promise.all(fontNames.map((fontName) => figma.loadFontAsync(fontName)))
      .then(() => {
        const palette = data.palette;
        const nodes: SceneNode[] = [];
        const paletteFrame = createPalette(palette);
        figma.currentPage.appendChild(paletteFrame);
        nodes.push(paletteFrame);
      })
      .catch((err) => {
        console.error('Error on loading fonts: ', err);
      });
  }
};
