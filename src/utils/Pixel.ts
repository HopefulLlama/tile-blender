export type VisualPixel = {
  x: number;
  y: number;
};

export const getPixelAtIndex = (source: ImageData, firstIndex: number): [number, number, number, number] => {
  return [
    source.data[firstIndex],
    source.data[firstIndex + 1],
    source.data[firstIndex + 2],
    source.data[firstIndex + 3],
  ];
}

export const convertDataPixelIndexToVisualPixel = (index: number, width: number): VisualPixel => {
  const x = index % width;
  const y = Math.floor(index / width);

  return { x, y };
}

export const convertVisualPixelToDataPixelIndex = (visualPixel: VisualPixel, width: number): number => {
  const { x, y } = visualPixel;
  return ((y * width) + x) * 4;
}