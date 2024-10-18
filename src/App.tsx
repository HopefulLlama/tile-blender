import React, { useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import ReactImageUploading, { ImageListType, ImageType } from 'react-images-uploading';
import { processImagePair, segments } from './ImageCopyStrategies';

function App() {
  const [images, setImages] = useState<ImageListType>([]);
  const [imageResults, setImageResults] = useState<string[]>([]);

  const canvasRef0 = useRef<HTMLCanvasElement | null>(null);
  const canvasRef1 = useRef<HTMLCanvasElement | null>(null);

  const getCombinations = (digits: number[]): number[][] => {
    const result: number[][] = [];

    // Get the total number of possible combinations, which is 2^n (where n is the number of digits)
    const totalCombinations = Math.pow(2, digits.length);

    // Loop through all possible combinations (each combination corresponds to a binary number)
    for (let i = 0; i < totalCombinations; i++) {
      const combination: number[] = [];
      for (let j = 0; j < digits.length; j++) {
        // Check if the jth bit of i is set (1) to include the corresponding digit
        if (i & (1 << j)) {
          combination.push(digits[j]);
        }
      }
      result.push(combination);
    }

    return result;
  };

  const permutations = getCombinations(Object.keys(segments).map((key) => parseInt(key, 10)));

    useEffect(() => {
      canvasRef0.current = document.getElementById("0") as HTMLCanvasElement;
      canvasRef1.current = document.getElementById("1") as HTMLCanvasElement;
    }, [])

  const onChange = (imageList: ImageListType) => {
    setImages(imageList);
  };

  const drawImageToCanvas = (image: ImageType, canvas: HTMLCanvasElement): Promise<ImageData> => {
    return new Promise((resolve) => {
      const temporaryImage = new Image();
      temporaryImage.onload = () => {
        canvas.height = temporaryImage.height;
        canvas.width = temporaryImage.width;

        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(temporaryImage, 0, 0);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          resolve(imageData);
        }
      };

      if (image.dataURL) {
        temporaryImage.src = image.dataURL;
      }
    });
  };

  const getDataUrl = (imageData: ImageData, canvas: HTMLCanvasElement): string => {
    const context = canvas.getContext("2d");

    if (context) {
      context.putImageData(imageData, 0, 0);
      return canvas.toDataURL();
    }
    return "";
  };

  const drawSourceAndGetData = (): Promise<ImageData[]> => {
    const canvas0 = canvasRef0.current;
    const canvas1 = canvasRef1.current;

    if (canvas0 && canvas1) {
      const canvases = [canvas0, canvas1];

      const pairs: [HTMLCanvasElement, ImageType][] = canvases.map((canvas, index) => [canvas, images[index]]);

      return Promise.all(pairs.map(([canvas, srcImage]) => drawImageToCanvas(srcImage, canvas)));
    } else {
      return Promise.resolve([]);
    }
  };

  const drawResult = (imageData: ImageData[]): string[] => {
    const canvas = document.createElement("canvas");
    const [imageDataLeft, imageDataRight] = imageData;

    canvas.width = imageDataLeft.width;
    canvas.height = imageDataRight.height;

    return permutations.map((permutation) => {
      const segmentsToBeCopied = permutation.map((value) => segments[value]);

      const result = processImagePair(imageDataLeft, imageDataRight, segmentsToBeCopied);
      return getDataUrl(result, canvas);
    });
  };

  const doTheThing = async () => {
    const imageData = await drawSourceAndGetData();
    const results = drawResult(imageData);
    setImageResults(results);
  };

  return (
    <div className="App">
      <p>Upload two images</p>
      <ReactImageUploading
        multiple
        value={images}
        onChange={onChange}
        maxNumber={2}
      >
        {({
          imageList,
          onImageUpload,
          onImageRemoveAll,
          onImageUpdate,
          onImageRemove,
          isDragging,
          dragProps
        }) => (
          // write your building UI
          <div className="upload__image-wrapper">
            <button
              style={isDragging ? { color: "red" } : undefined}
              onClick={onImageUpload}
              {...dragProps}
            >
              Click or Drop here
            </button>
            <button onClick={onImageRemoveAll}>Remove all images</button>
            {imageList.map((image, index) => (
              <div key={index} className="image-item">
                <img src={image.dataURL} />
                <div className="image-item__btn-wrapper">
                  <button onClick={() => onImageUpdate(index)}>Update</button>
                  <button onClick={() => onImageRemove(index)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ReactImageUploading>

      <button onClick={() => doTheThing()}>Do the thing</button>

      <canvas id="0" />
      <canvas id="1" />

      <p>Results</p>
      {imageResults.map((result) => <img src={result} />)}
    </div>
  );
}

export default App;

//** garbage */
// Mask border between images
// for(let counter = 0; counter < 4 * imageDataLeft.width * imageDataLeft.height; counter += 4) {
//   const index = Math.floor(counter / 4);

//   const x = index % imageDataLeft.width;
//   const y = Math.floor(index / imageDataLeft.width);

//   const xMinimumBoundary = oneThirdWidth - 5;
//   const xMaximumBoundary = oneThirdWidth + 5;

//   const yMinimumBoundary = oneThirdHeight - 5;
//   const yMaximumBoundary = oneThirdHeight + 5;

//   // This condition will need to change depending on where the boundary is, haven't figured out how to make this dynamic
//   if(
//     (x > xMinimumBoundary && x < xMaximumBoundary && y < yMaximumBoundary) ||
//     (y > yMinimumBoundary && y < yMaximumBoundary && x < xMaximumBoundary)
//   ) {
//     resultPixels[counter] = 0;
//     resultPixels[counter + 1] = 0;
//     resultPixels[counter + 2] = 0;
//     resultPixels[counter + 3] = 255;
//   } else {
//     continue;
//   }
// }

// Paint by neighbours
// for(let counter = 0; counter < 4 * imageDataLeft.width * imageDataLeft.height; counter += 4) {
//   const index = Math.floor(counter / 4);

//   const x = index % imageDataLeft.width;
//   const y = Math.floor(index / imageDataLeft.width);

//   const xMinimumBoundary = oneThirdWidth - 5;
//   const xMaximumBoundary = oneThirdWidth + 5;

//   const yMinimumBoundary = oneThirdHeight - 5;
//   const yMaximumBoundary = oneThirdHeight + 5;

//   const getPixel = (data: number[], x: number, y: number) => {
//     const index = (y * imageDataLeft.width + x) * 4;
//     return [data[index], data[index + 1], data[index + 2], data[index + 3]]; // RGBA
//   };

//   const setPixel = (data: number[], x: number, y: number, pixel: number[]) => {
//     const index = (y * imageDataLeft.width + x) * 4;
//     data[index] = pixel[0];
//     data[index + 1] = pixel[1];
//     data[index + 2] = pixel[2];
//     data[index + 3] = pixel[3];
//   };

//   const isMasked = (data: number[], x: number, y: number) => {
//     const index = (y * imageDataLeft.width + x) * 4;
//     return data[index] === 0 && data[index + 1] === 0 && data[index + 2] === 0 && data[index + 3] === 255;
//   };

//   const bilinearFill = (data: number[], x: number, y: number) => {
//     let neighbors = [];
//     if (x > 0) neighbors.push(getPixel(data, x - 1, y)); // Left
//     if (x > 1) neighbors.push(getPixel(data, x - 2, y)); // Left
//     if (x > 2) neighbors.push(getPixel(data, x - 3, y)); // Left
//     if (x > 3) neighbors.push(getPixel(data, x - 4, y)); // Left
//     if (x > 4) neighbors.push(getPixel(data, x - 5, y)); // Left

//     if (x < imageDataLeft.width) neighbors.push(getPixel(data, x + 1, y)); // Right
//     if (x < imageDataLeft.width - 1) neighbors.push(getPixel(data, x + 2, y)); // Right
//     if (x < imageDataLeft.width - 2) neighbors.push(getPixel(data, x + 3, y)); // Right
//     if (x < imageDataLeft.width - 3) neighbors.push(getPixel(data, x + 4, y)); // Right
//     if (x < imageDataLeft.width - 4) neighbors.push(getPixel(data, x + 5, y)); // Right

//     if (y > 0) neighbors.push(getPixel(data, x, y - 1)); // Top
//     if (y > 1) neighbors.push(getPixel(data, x, y - 2)); // Top
//     if (y > 2) neighbors.push(getPixel(data, x, y - 3)); // Top
//     if (y > 3) neighbors.push(getPixel(data, x, y - 4)); // Top
//     if (y > 4) neighbors.push(getPixel(data, x, y - 5)); // Top

//     if (y < imageDataLeft.height) neighbors.push(getPixel(data, x, y + 1)); // Bottom
//     if (y < imageDataLeft.height - 1) neighbors.push(getPixel(data, x, y + 2)); // Bottom
//     if (y < imageDataLeft.height - 2) neighbors.push(getPixel(data, x, y + 3)); // Bottom
//     if (y < imageDataLeft.height - 3) neighbors.push(getPixel(data, x, y + 4)); // Bottom
//     if (y < imageDataLeft.height - 3) neighbors.push(getPixel(data, x, y + 5)); // Bottom

//     if (neighbors.length > 0) {
//       const avgColor = neighbors.reduce((acc, color) => {
//         return [acc[0] + color[0], acc[1] + color[1], acc[2] + color[2], acc[3] + color[3]];
//       }, [0, 0, 0, 0]);

//       const resultColor = avgColor.map(c => Math.round(c / neighbors.length));
//       setPixel(data, x, y, resultColor);
//     }
//   }

//   // This condition will need to change depending on where the boundary is, haven't figured out how to make this dynamic
//   for(let counter = 0; counter < 100; counter++) {
//     if(
//       (x > xMinimumBoundary && x < xMaximumBoundary && y < yMaximumBoundary) ||
//       (y > yMinimumBoundary && y < yMaximumBoundary && x < xMaximumBoundary)
//     ) { // Check nearest neighbors to fill the masked pixel
//       bilinearFill(resultPixels, x, y);
//     } else {
//       continue;
//     }
//   }
// }

// const resultClampedArray = new Uint8ClampedArray(resultPixels);
// const resultImageData = new ImageData(resultClampedArray, imageDataLeft.width, imageDataRight.width);