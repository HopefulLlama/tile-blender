import { convertVisualPixelToDataPixelIndex, getPixelAtIndex } from "./utils/Pixel";
import { SeamLabel, SeamOrientation } from "./utils/Seam";
import { Segment, segments } from "./utils/Segment";

export const segmentToSeams:{ [key: number]: SeamLabel[] } = {
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

export const processImageSeam = (source: ImageData, copied: ImageData, seam: SeamLabel): void => {
  const { segment, orientation } = seam;

  const [segmentData] = Segment.fromImageDataAndLabels(source, [segments[segment]]);
  const ditherSeam = segmentData.getSeam(orientation, 0.2);
  const visualPixels = ditherSeam.getPixelsToBeProcessed();

  visualPixels.forEach((visualPixel) => {
    const index = convertVisualPixelToDataPixelIndex(visualPixel, source.width);

    const dataPixel = getPixelAtIndex(source, index);
    dataPixel.forEach((data, dataIndex) => {
      const finalIndex = index + dataIndex;

      copied.data[finalIndex] = data;
    });
  });
};
