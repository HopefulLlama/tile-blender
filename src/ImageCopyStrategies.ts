type BoundaryData = {
  width: [ number, number ],
  height: [ number, number ],
};

const getBoundaries = (image: ImageData): BoundaryData => {
  const oneThirdWidth = image.width / 3;
  const oneThirdHeight = image.width / 3;

  return {
    width: [ oneThirdWidth, oneThirdWidth * 2],
    height: [ oneThirdHeight, oneThirdHeight * 2],
  }
};

const getPixelAtIndex = (source: ImageData, firstIndex: number): [number, number, number, number] => {
  return [
    source.data[firstIndex],
    source.data[firstIndex + 1],
    source.data[firstIndex + 2],
    source.data[firstIndex + 3],
  ];
}

const processImagePair = (left: ImageData, right: ImageData, getSource: (left: ImageData, right: ImageData, visualX: number, visualY: number, boundaries: BoundaryData) => ImageData): ImageData => {
  const boundaries = getBoundaries(left);

  const resultsLength = 4 * left.width * left.height;
  const counterIncrement = 4;

  let resultPixels: number[] = []
  for(let counter = 0; counter < resultsLength; counter += counterIncrement) {
    const pixelIndex = Math.floor(counter/4);

    const x = pixelIndex % left.width;
    const y = Math.floor(pixelIndex / left.width);

    const source = getSource(left, right, x, y, boundaries);
    const pixel = getPixelAtIndex(source, counter);
    resultPixels.push(...pixel);
  }

  const resultClampedArray = new Uint8ClampedArray(resultPixels);
  return new ImageData(resultClampedArray, left.width, left.width);
};

export const copySegmentOne = (left: ImageData, right: ImageData): ImageData => {
  return processImagePair(left, right, (left: ImageData, right: ImageData, visualX: number, visualY: number, boundaries: BoundaryData) => {
    const { width, height } = boundaries;

    const [ oneThirdWidth ] = width;
    const [ oneThirdHeight ] = height;

    return visualX < oneThirdWidth && visualY < oneThirdHeight ? left : right;
  });
};

