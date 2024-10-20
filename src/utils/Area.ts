import { VisualPixel } from "./Pixel";

export class Area {
  topLeft: VisualPixel;
  bottomRight: VisualPixel;
  width: number;
  height: number;

  constructor(topLeft: VisualPixel, bottomRight: VisualPixel) {
    this.topLeft = topLeft;
    this.bottomRight = bottomRight;

    this.width = this.bottomRight.x - this.topLeft.x;
    this.height = this.bottomRight.y - this.topLeft.y;
  }

  getAllVisualPixels(): VisualPixel[] {
    let pixels: VisualPixel[] = [];

    for(let xCounter = this.topLeft.x; xCounter <= this.bottomRight.x; xCounter++) {
      for(let yCounter = this.topLeft.y; yCounter <= this.bottomRight.y; yCounter++) {
        pixels.push({ x: xCounter, y: yCounter });
      }
    }

    return pixels;
  }
};
