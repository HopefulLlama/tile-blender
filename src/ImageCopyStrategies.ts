import { convertDataPixelIndexToVisualPixel, getPixelAtIndex } from "./utils/Pixel";
import { isPixelInSegment, Segment, SegmentLabel } from "./utils/Segment";

export const processImagePair = (left: ImageData, right: ImageData, segmentLabels: SegmentLabel[]): ImageData => {
  const resultsLength = 4 * left.width * left.height;
  const counterIncrement = 4;

  const segments = Segment.fromImageDataAndLabels(left, segmentLabels);

  let resultPixels: number[] = []
  for(let counter = 0; counter < resultsLength; counter += counterIncrement) {
    const pixelIndex = Math.floor(counter/4);

    const visualPixel = convertDataPixelIndexToVisualPixel(pixelIndex, left.width);
    const isLeft = segments.some((segment) => segment.doesSegmentContainVisualPixel(visualPixel));

    const source = isLeft ? left : right;
    const pixel = getPixelAtIndex(source, counter);
    resultPixels.push(...pixel);
  }

  const resultClampedArray = new Uint8ClampedArray(resultPixels);
  return new ImageData(resultClampedArray, left.width, left.width);
};
