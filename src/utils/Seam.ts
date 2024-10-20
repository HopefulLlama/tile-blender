import { Area } from "./Area";
import { VisualPixel } from "./Pixel";

export enum SeamOrientation {
  NORTH,
  NORTH_EAST,
  EAST,
  SOUTH_EAST,
  SOUTH,
  SOUTH_WEST,
  WEST,
  NORTH_WEST,
};

export type SeamLabel = {
  segment: number;
  orientation: SeamOrientation;
};

export class DitherSeam {
  area: Area;

  constructor(topLeft: VisualPixel, bottomRight: VisualPixel) {
    this.area = new Area(topLeft, bottomRight);
  }

  getPixelsToBeProcessed(): VisualPixel[] {
    return this.area.getAllVisualPixels()
      .filter((pixel) => (pixel.x + pixel.y) % 2 === 0);
  }
}
