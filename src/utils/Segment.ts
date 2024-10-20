import { Area } from "./Area";
import { VisualPixel } from "./Pixel";
import { DitherSeam, SeamOrientation } from "./Seam";

export type SegmentLabel = {
  row: number;
  column: number;
}

export const segments: { [key: number]: SegmentLabel } = {
  1: { row: 1, column: 1 },
  2: { row: 1, column: 2 },
  3: { row: 1, column: 3 },
  4: { row: 2, column: 1 },
  5: { row: 2, column: 2 },
  6: { row: 2, column: 3 },
  7: { row: 3, column: 1 },
  8: { row: 3, column: 2 },
  9: { row: 3, column: 3 },
};

export const isPixelInSegment = (widthOrHeight: number, visualCoordinate: number, rowOrColumn: number): boolean => {
  const lowerBound = Math.round(widthOrHeight / 3) * (rowOrColumn - 1);
  const upperBound = Math.round(widthOrHeight / 3) * rowOrColumn;

  return visualCoordinate >= lowerBound && visualCoordinate <= upperBound;
};

export class Segment {
  area: Area;

  constructor(topLeft: VisualPixel, bottomRight: VisualPixel) {
    this.area = new Area(topLeft, bottomRight);
  }

  static fromImageData(imageData: ImageData): Segment[] {
    const { width, height } = imageData;

    const oneThirdWidth = Math.round(width / 3);
    const twoThirdWidth = Math.round(width / 3 * 2);

    const oneThirdHeight = Math.round(height / 3);
    const twoThirdHeight = Math.round(height / 3 * 2);

    return [
      new Segment(
        { x: 0, y: 0},
        { x: oneThirdWidth, y: oneThirdHeight },
      ),
      new Segment(
        { x: oneThirdWidth + 1, y: 0},
        { x: twoThirdWidth, y: oneThirdHeight },
      ),
      new Segment(
        { x: twoThirdWidth + 1, y: 0},
        { x: width, y: oneThirdHeight },
      ),

      new Segment(
        { x: 0, y: oneThirdHeight + 1},
        { x: oneThirdWidth, y: twoThirdHeight },
      ),
      new Segment(
        { x: oneThirdWidth + 1, y: oneThirdHeight + 1},
        { x: twoThirdWidth, y: twoThirdHeight },
      ),
      new Segment(
        { x: twoThirdWidth + 1, y: oneThirdHeight + 1},
        { x: width, y: twoThirdHeight },
      ),

      new Segment(
        { x: 0, y: twoThirdHeight + 1},
        { x: oneThirdWidth, y: height },
      ),
      new Segment(
        { x: oneThirdWidth + 1, y: twoThirdHeight + 1},
        { x: twoThirdWidth, y: height },
      ),
      new Segment(
        { x: twoThirdWidth + 1, y: twoThirdHeight + 1},
        { x: width, y: height },
      ),
    ];
  }

  static fromImageDataAndLabels(imageData: ImageData, labels: SegmentLabel[]): Segment[] {
    const segments = Segment.fromImageData(imageData);

    const indices = labels.map((label) => ((label.row - 1) * 3) + label.column - 1);

    return segments.filter((_, index) => indices.includes(index));
  }

  doesSegmentContainVisualPixel(visualPixel: VisualPixel): boolean {
    const isX = visualPixel.x >= this.area.topLeft.x && visualPixel.x <= this.area.bottomRight.x;
    const isY = visualPixel.y >= this.area.topLeft.y && visualPixel.y <= this.area.bottomRight.y;

    return isX && isY;
  }

  getSeam(orientation: SeamOrientation, proportion: number): DitherSeam {
    const { topLeft, bottomRight } = this.area;
    const proportionOfWidth = Math.floor(this.area.width * proportion);
    const proportionOfHeight = Math.floor(this.area.height * proportion);

    switch (orientation) {
      case SeamOrientation.NORTH:
        return new DitherSeam(
          topLeft,
          { x: bottomRight.x, y: topLeft.y + proportionOfHeight },
        )
      case SeamOrientation.NORTH_EAST:
        return new DitherSeam(
          { x: bottomRight.x - proportionOfWidth, y: topLeft.y },
          { x: bottomRight.x, y: topLeft.y + proportionOfHeight},
        );
      case SeamOrientation.EAST:
        return new DitherSeam(
          { x: bottomRight.x - proportionOfWidth, y: topLeft.y },
          bottomRight,
        );
      case SeamOrientation.SOUTH_EAST:
        return new DitherSeam(
          { x: bottomRight.x - proportionOfWidth, y: bottomRight.y - proportionOfHeight },
          bottomRight,
        );
      case SeamOrientation.SOUTH:
        return new DitherSeam(
          { x: topLeft.x, y: bottomRight.y - proportionOfHeight},
          bottomRight,
        );
      case SeamOrientation.SOUTH_WEST:
        return new DitherSeam(
          { x: topLeft.x, y: bottomRight.y - proportionOfHeight },
          { x: topLeft.x + proportionOfWidth, y: bottomRight.y },
        );
      case SeamOrientation.WEST:
        return new DitherSeam(
          topLeft,
          { x: topLeft.x + proportionOfWidth, y: bottomRight.y },
        );
      case SeamOrientation.NORTH_WEST:
        return new DitherSeam(
          topLeft,
          { x: topLeft.x + proportionOfWidth, y: topLeft.y + proportionOfHeight}
        );
    }
  }
}
