type Segment = {
  row: number;
  column: number;
}

export const segments: { [key: number]: { row: number, column: number} } = {
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

export const getPixelAtIndex = (source: ImageData, firstIndex: number): [number, number, number, number] => {
  return [
    source.data[firstIndex],
    source.data[firstIndex + 1],
    source.data[firstIndex + 2],
    source.data[firstIndex + 3],
  ];
}

const isPixelInSegment = (widthOrHeight: number, visualCoordinate: number, rowOrColumn: number): boolean => {
  const lowerBound = Math.round(widthOrHeight / 3) * (rowOrColumn - 1);
  const upperBound = Math.round(widthOrHeight / 3) * rowOrColumn;

  return visualCoordinate >= lowerBound && visualCoordinate <= upperBound;
};

export const processImagePair = (left: ImageData, right: ImageData, segments: Segment[]): ImageData => {
  const resultsLength = 4 * left.width * left.height;
  const counterIncrement = 4;

  let resultPixels: number[] = []
  for(let counter = 0; counter < resultsLength; counter += counterIncrement) {
    const pixelIndex = Math.floor(counter/4);

    const x = pixelIndex % left.width;
    const y = Math.floor(pixelIndex / left.width);

    const isLeft = segments.some((segment) => isPixelInSegment(left.width, x, segment.column) && isPixelInSegment(left.height, y, segment.row));
    const source = isLeft ? left : right;
    const pixel = getPixelAtIndex(source, counter);
    resultPixels.push(...pixel);
  }

  const resultClampedArray = new Uint8ClampedArray(resultPixels);
  return new ImageData(resultClampedArray, left.width, left.width);
};
