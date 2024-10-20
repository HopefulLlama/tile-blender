import { processImagePair } from "../ImageCopyStrategies";
import { processImageSeam, segmentToSeams } from "../ImageSeamProcessor";
import { segments } from "../utils/Segment";


export const processImage = (permutation: number[], imageDataLeft: ImageData, imageDataRight: ImageData): ImageData => {
  const segmentsToBeCopied = permutation.map((value) => segments[value]);

  const result = processImagePair(imageDataLeft, imageDataRight, segmentsToBeCopied);

  permutation
    .flatMap((value) => segmentToSeams[value])
    .filter((seam) => !permutation.includes(seam.segment))
    .forEach((seam) => {
      processImageSeam(imageDataLeft, result, seam);
    });

  return result;
};
