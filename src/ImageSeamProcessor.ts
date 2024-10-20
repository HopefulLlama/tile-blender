import { getPixelAtIndex, segments } from "./ImageCopyStrategies";

enum SeamOrientation {
  NORTH,
  NORTH_EAST,
  EAST,
  SOUTH_EAST,
  SOUTH,
  SOUTH_WEST,
  WEST,
  NORTH_WEST,
};

type Seam = {
  segment: number;
  orientation: SeamOrientation;
};

type SeamDisplayType = {
  getWidth: (segmentWidth: number) => number;
  getHeight: (segmentHeight: number) => number;
};

const seamDisplayType: { [key: string]: SeamDisplayType } = {
  HORIZONTAL: {
    getWidth: (segmentWidth: number) => segmentWidth,
    getHeight: (segmentHeight: number) => segmentHeight / 5,
  },
  VERTICAL: {
    getWidth: (segmentWidth: number) => segmentWidth / 5,
    getHeight: (segmentHeight: number) => segmentHeight,
  },
  CORNER: {
    getWidth: (segmentWidth: number) => segmentWidth / 5,
    getHeight: (segmentHeight: number) => segmentHeight / 5,
  },
};

type SeamPlacement = {
  type: SeamDisplayType;
  getXOffset: (segmentWidth: number) => number;
  getYOffset: (segmentHeight: number) => number;
  getSourcePixels: (data: ImageData, x: number, y: number) => number[][];
  setDestinationPixels: (data: ImageData, newData: number[][], x: number, y: number) => void;
};

export const segmentToSeams:{ [key: number]: Seam[] } = {
  1: [
    { segment: 2, orientation: SeamOrientation.WEST },
    { segment: 4, orientation: SeamOrientation.NORTH },
    { segment: 5, orientation: SeamOrientation.NORTH_WEST },
  ],
  2: [
    { segment: 1, orientation: SeamOrientation.EAST },
    { segment: 3, orientation: SeamOrientation.WEST },
    { segment: 4, orientation: SeamOrientation.NORTH_EAST },
    { segment: 5, orientation: SeamOrientation.NORTH },
    { segment: 6, orientation: SeamOrientation.NORTH_WEST },
  ],
  3: [
    { segment: 2, orientation: SeamOrientation.EAST },
    { segment: 5, orientation: SeamOrientation.NORTH_EAST },
    { segment: 6, orientation: SeamOrientation.NORTH },
  ],
  4: [
    { segment: 1, orientation: SeamOrientation.SOUTH },
    { segment: 2, orientation: SeamOrientation.SOUTH_WEST },
    { segment: 5, orientation: SeamOrientation.WEST },
    { segment: 7, orientation: SeamOrientation.NORTH },
    { segment: 8, orientation: SeamOrientation.NORTH_WEST },
  ],
  5: [
    { segment: 1, orientation: SeamOrientation.SOUTH_EAST },
    { segment: 2, orientation: SeamOrientation.SOUTH },
    { segment: 3, orientation: SeamOrientation.SOUTH_WEST },
    { segment: 4, orientation: SeamOrientation.EAST },
    { segment: 6, orientation: SeamOrientation.WEST },
    { segment: 7, orientation: SeamOrientation.NORTH_EAST },
    { segment: 8, orientation: SeamOrientation.NORTH },
    { segment: 9, orientation: SeamOrientation.NORTH_WEST },
  ],
  6: [
    { segment: 2, orientation: SeamOrientation.SOUTH_EAST },
    { segment: 3, orientation: SeamOrientation.SOUTH },
    { segment: 5, orientation: SeamOrientation.EAST },
    { segment: 8, orientation: SeamOrientation.NORTH_EAST },
    { segment: 9, orientation: SeamOrientation.NORTH },
  ],
  7: [
    { segment: 4, orientation: SeamOrientation.SOUTH },
    { segment: 5, orientation: SeamOrientation.SOUTH_WEST },
    { segment: 8, orientation: SeamOrientation.WEST },
  ],
  8: [
    { segment: 4, orientation: SeamOrientation.SOUTH_EAST },
    { segment: 5, orientation: SeamOrientation.SOUTH },
    { segment: 6, orientation: SeamOrientation.SOUTH_WEST },
    { segment: 7, orientation: SeamOrientation.EAST },
    { segment: 9, orientation: SeamOrientation.WEST },
  ],
  9: [
    { segment: 5, orientation: SeamOrientation.SOUTH_EAST },
    { segment: 6, orientation: SeamOrientation.SOUTH },
    { segment: 8, orientation: SeamOrientation.EAST },
  ],
};

const convertXYToIndex = (imageWidth: number, x: number, y: number): number => {
  return ((y * imageWidth) + x) * 4;
};

const pixelsPerDither = 5;

const seamToPlacement: { [key: number]: SeamPlacement } = {
  [SeamOrientation.NORTH]: {
    type: seamDisplayType.HORIZONTAL,
    getXOffset: () => 0,
    getYOffset: () => 0,
    getSourcePixels: (source: ImageData, x: number, y: number): number[][] => {
      const segmentWidth = Math.round(source.width / 3);

      const pixels = [];
      for(let xCounter = 0; xCounter < segmentWidth; xCounter++) {
        for(let yCounter = 0; yCounter < pixelsPerDither; yCounter++) {
          const yOffset = ((yCounter + 1) * 2);
          const index = convertXYToIndex(source.width, x + xCounter, y - yOffset);

          const pixel = getPixelAtIndex(source, index);
          pixels.push(pixel);
        }
      }

      return pixels;
    },
    setDestinationPixels(data, newData, x, y) {
      const destinationIndex = convertXYToIndex(data.width, x, y);

      newData.forEach((pixel, index) => {
        const xOffset = Math.floor(index / pixelsPerDither) * 4;
        const yJitter = Math.floor(index / pixelsPerDither) % 2;
        const yOffset = ((Math.floor(index % pixelsPerDither) * 2) + yJitter) * data.width * 4;

        pixel.forEach((pixelData, pixelIndex) => {
          const finalIndex = destinationIndex + xOffset + yOffset + pixelIndex;
          data.data[finalIndex] = pixelData;
        });
      });
    },
  },
  [SeamOrientation.NORTH_EAST]: {
    type: seamDisplayType.CORNER,
    getXOffset: (segmentWidth: number) => segmentWidth,
    getYOffset: () => 0,
    getSourcePixels: () => [],
    setDestinationPixels: () => {},
  },
  [SeamOrientation.EAST]: {
    type: seamDisplayType.VERTICAL,
    getXOffset: (segmentWidth: number) => segmentWidth,
    getYOffset: () => 0,
    getSourcePixels: (source: ImageData, x: number, y: number): number[][] => {
      const segmentHeight = Math.round(source.height / 3);

      const pixels = [];
      for(let yCounter = 0; yCounter < segmentHeight; yCounter++) {
        for(let xCounter = 0; xCounter < pixelsPerDither; xCounter++) {
          const xOffset = ((xCounter + 1) * 2);
          const index = convertXYToIndex(source.width, x + xOffset, y + yCounter);

          const pixel = getPixelAtIndex(source, index);
          pixels.push(pixel);
        }
      }

      return pixels;
    },
    setDestinationPixels(data, newData, x, y) {
      const destinationIndex = convertXYToIndex(data.width, x, y);

      newData.forEach((pixel, index) => {
        const xJitter = Math.floor(index / pixelsPerDither) % 2;
        const xOffset = ((Math.floor(index % pixelsPerDither) * 2) + xJitter) * 4;
        const yOffset = Math.floor(index / pixelsPerDither) * data.width * 4;

        pixel.forEach((pixelData, pixelIndex) => {
          const finalIndex = destinationIndex - xOffset + yOffset + pixelIndex;
          data.data[finalIndex] = pixelData;
        });
      });
    },
  },
  [SeamOrientation.SOUTH_EAST]: {
    type: seamDisplayType.CORNER,
    getXOffset: (segmentWidth: number) => segmentWidth,
    getYOffset: (segmentHeight: number) => segmentHeight,
    getSourcePixels: () => [],
    setDestinationPixels: () => {},
  },
  [SeamOrientation.SOUTH]: {
    type: seamDisplayType.HORIZONTAL,
    getXOffset: () => 0,
    getYOffset: (segmentHeight: number) => segmentHeight,
    getSourcePixels: (source: ImageData, x: number, y: number): number[][] => {
      const segmentWidth = Math.round(source.width / 3);

      const pixels = [];
      for(let xCounter = 0; xCounter < segmentWidth; xCounter++) {
        for(let yCounter = 0; yCounter < pixelsPerDither; yCounter++) {
          const yOffset = ((yCounter + 1) * 2);
          const index = convertXYToIndex(source.width, x + xCounter, y + yOffset);

          const pixel = getPixelAtIndex(source, index);
          pixels.push(pixel);
        }
      }

      return pixels;
    },
    setDestinationPixels(data, newData, x, y) {
      const destinationIndex = convertXYToIndex(data.width, x, y);

      newData.forEach((pixel, index) => {
        const xOffset = Math.floor(index / pixelsPerDither) * 4;
        const yJitter = Math.floor(index / pixelsPerDither) % 2;
        const yOffset = ((Math.floor(index % pixelsPerDither) * 2) + yJitter) * data.width * 4;

        pixel.forEach((pixelData, pixelIndex) => {
          const finalIndex = destinationIndex + xOffset - yOffset + pixelIndex;
          data.data[finalIndex] = pixelData;
        });
      });
    },
  },
  [SeamOrientation.SOUTH_WEST]: {
    type: seamDisplayType.CORNER,
    getXOffset: () => 0,
    getYOffset: (segmentHeight: number) => segmentHeight,
    getSourcePixels: () => [],
    setDestinationPixels: () => {},
  },
  [SeamOrientation.WEST]: {
    type: seamDisplayType.VERTICAL,
    getXOffset: () => 0,
    getYOffset: () => 0,
    getSourcePixels: (source: ImageData, x: number, y: number): number[][] => {
      const segmentHeight = Math.round(source.height / 3);

      const pixels = [];
      for(let yCounter = 0; yCounter < segmentHeight; yCounter++) {
        for(let xCounter = 0; xCounter < pixelsPerDither; xCounter++) {
          const xOffset = ((xCounter + 1) * 2);
          const index = convertXYToIndex(source.width, x - xOffset, y + yCounter);

          const pixel = getPixelAtIndex(source, index);
          pixels.push(pixel);
        }
      }

      return pixels;
    },
    setDestinationPixels(data, newData, x, y) {
      const destinationIndex = convertXYToIndex(data.width, x, y);

      newData.forEach((pixel, index) => {
        const xJitter = Math.floor(index / pixelsPerDither) % 2;
        const xOffset = ((Math.floor(index % pixelsPerDither) * 2) + xJitter) * 4;
        const yOffset = Math.floor(index / pixelsPerDither) * data.width * 4;

        pixel.forEach((pixelData, pixelIndex) => {
          const finalIndex = destinationIndex + xOffset + yOffset + pixelIndex;
          data.data[finalIndex] = pixelData;
        });
      });
    },
  },
  [SeamOrientation.NORTH_WEST]: {
    type: seamDisplayType.CORNER,
    getXOffset: () => 0,
    getYOffset: () => 0,
    getSourcePixels: () => [],
    setDestinationPixels: () => {},
  },
}

export const processImageSeam = (source: ImageData, copied: ImageData, seam: Seam): void => {
  const { segment, orientation } = seam;
  const seamPlacement = seamToPlacement[orientation];
  const { row, column } = segments[segment];

  const segmentWidth = Math.round(source.width / 3);
  const segmentHeight = Math.round(source.height / 3);

  const segmentX = (column - 1) * segmentWidth;
  const segmentY = (row - 1) * segmentHeight;

  const additionalSeamOffsetX = seamPlacement.getXOffset(segmentWidth);
  const additionalSeamOffsetY = seamPlacement.getYOffset(segmentHeight);

  const x = segmentX + additionalSeamOffsetX;
  const y = segmentY + additionalSeamOffsetY;

  const pixels = seamPlacement.getSourcePixels(source, x, y);
  seamPlacement.setDestinationPixels(copied, pixels, x, y);
};
