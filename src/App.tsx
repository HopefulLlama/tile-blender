import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import ReactImageUploading, { ImageListType, ImageType } from 'react-images-uploading';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Paper } from '@mui/material';
import { segments } from './utils/Segment';

// @ts-ignore
// eslint-disable-next-line
import worker from 'workerize-loader!./worker/worker'
import { JonImage } from './JonImage';
import { getCombinations } from './utils/Combinations';
import JSZip from 'jszip';
import { saveAs } from "file-saver";

type ProcessedImage = {
  name: string;
  blob: Blob;
  dataUrl: string;
}

const removeFileExtension = (fileName: string): string => {
  const parts = fileName.split(".");
  parts.pop();

  return parts.join("");
}

function App() {
  const [uploadedImages, setUploadedImages] = useState<ImageListType>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasLeftRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRightRef = useRef<HTMLCanvasElement | null>(null);

  const placeholderSourceImages = [
    { name: "Left", source: "https://placehold.co/128" },
    { name: "Right", source: "https://placehold.co/128" },
  ];

  const numberOfWorkers = navigator.hardwareConcurrency;

  const permutations = getCombinations(Object.keys(segments).map((key) => parseInt(key, 10)));

    useEffect(() => {
      canvasLeftRef.current = document.getElementById("left") as HTMLCanvasElement;
      canvasRightRef.current = document.getElementById("right") as HTMLCanvasElement;
    }, [])

  const onChange = (imageList: ImageListType) => {
    setUploadedImages(imageList);
  };

  const drawImageToCanvas = (image: ImageType, canvas: HTMLCanvasElement): Promise<void> => {
    return new Promise((resolve) => {
      const temporaryImage = new Image();
      temporaryImage.onload = () => {
        canvas.height = temporaryImage.height;
        canvas.width = temporaryImage.width;

        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(temporaryImage, 0, 0);
          resolve();
        }
      };

      if (image.dataURL) {
        temporaryImage.src = image.dataURL;
      }
    });
  };

  const drawSourceImages = (canvases: HTMLCanvasElement[], images: ImageListType): Promise<void[]> => {
    const pairs: [HTMLCanvasElement, ImageType][] = canvases.map((canvas, index) => [canvas, uploadedImages[index]]);
    return Promise.all(pairs.map(([canvas, srcImage]) => drawImageToCanvas(srcImage, canvas)));
  };

  const getImageDataFromCanvas = (canvas: HTMLCanvasElement): ImageData | null => {
    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    return context.getImageData(0, 0, canvas.width, canvas.height);
  }

  const processImageWithWorker = async (permutations: number[][], imageDataLeft: ImageData, imageDataRight: ImageData): Promise<[number[], ImageData][]> => {
    const imageProcessWorker = worker();
    const results: [number[], ImageData][]= await (Promise.all(permutations.map(
      async (permutation) => {
        const imageData = await imageProcessWorker.processImage(permutation, imageDataLeft, imageDataRight);
        return [permutation, imageData];
      },
    )));
    imageProcessWorker.terminate();

    return results;
  };

  const getProcessedImageDatum = async (imageData: ImageData[]): Promise<ProcessedImage[]> => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return Promise.resolve([]);
    }
    const [imageDataLeft, imageDataRight] = imageData;

    canvas.width = imageDataLeft.width;
    canvas.height = imageDataRight.height;

    const permutationsAsChunks = Array(Math.ceil(permutations.length / numberOfWorkers))
      .fill(null)
      .map((_, index) => index * numberOfWorkers)
      .map((index) => permutations.slice(index, index + numberOfWorkers))

    const resultsData = (await Promise.all(permutationsAsChunks.flatMap(async (permutations) => {
      return await processImageWithWorker(permutations, imageDataLeft, imageDataRight);
    }))).flat();

    const results = await Promise.all(resultsData.map(async (resultsData) => {
      const [permutation, resultImageData] = resultsData;
      context.putImageData(resultImageData, 0, 0);
      const dataUrl = canvas.toDataURL();
      const blob: Blob = await (new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob as Blob));
      }));

      return {
        name: `${removeFileExtension(uploadedImages[1].file?.name ?? "")}-${removeFileExtension(uploadedImages[0].file?.name ?? "")}-${permutation.join("")}.png`,
        blob,
        dataUrl,
      };
    }));

    return results;
  };

  const processImages = async () => {
    setIsProcessing(true);

    const canvasLeft = canvasLeftRef.current;
    const canvasRight = canvasRightRef.current;

    if (canvasLeft && canvasRight) {
      await drawSourceImages([canvasLeft, canvasRight], uploadedImages);

      const imageDataLeft = getImageDataFromCanvas(canvasLeft);
      const imageDataRight = getImageDataFromCanvas(canvasRight);

      if (imageDataLeft && imageDataRight) {
        const results = await getProcessedImageDatum([imageDataLeft, imageDataRight]);
        setProcessedImages(results);
      }
    }
    setIsProcessing(false);
  };

  const downloadAsZip = async (): Promise<void> => {
    const zip = new JSZip();
    processedImages.forEach((processedImage) => {
      const { name, blob } = processedImage;
      zip.file(`${name}`, blob);
    });
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "tileblender.zip");
  };

  return (
    <Container fixed>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tile Blender
          </Typography>
        </Toolbar>
      </AppBar>
      <ReactImageUploading
        multiple
        value={uploadedImages}
        onChange={onChange}
        maxNumber={2}
      >
        {({
          imageList,
          onImageUpload,
          onImageRemove,
          onImageRemoveAll,
          onImageUpdate,
          isDragging,
          dragProps
        }) => (
          <Paper className="jon-paper">
            <Typography variant="h6">
              Upload Images
            </Typography>
            <Box>
              <Button
                variant="text"
                style={isDragging ? { color: "green" } : undefined}
                disabled={imageList.length === 2}
                onClick={onImageUpload}
                {...dragProps}
              >
                Click or Drop here
              </Button>
              <Button variant="outlined" onClick={onImageRemoveAll} disabled={imageList.length === 0}>Remove all images</Button>
            </Box>
            <Box>
              {placeholderSourceImages.map((placeholderImage, index) => {
                const image = imageList[index];
                const source = image?.dataURL ?? placeholderImage.source;

                return <JonImage
                  title={placeholderImage.name}
                  source={source}
                  buttons={[
                    { text: 'Update', onClick: () => onImageUpdate(index) },
                    { text: 'Remove', onClick: () => onImageRemove(index) },
                  ]}
                />
              })}
            </Box>

            <Button variant='contained' disabled={imageList.length < 2} onClick={() => processImages()}>Process Images</Button>
          </Paper>
        )}
      </ReactImageUploading>

      {isProcessing && <Paper className="jon-paper"><p>processing...</p></Paper>}

      <Paper className="jon-paper" sx={{ display: !isProcessing ? "block" : "none" }}>
        <Typography variant="h6">
          Results
        </Typography>
        {processedImages.length === 0 && <p>No results yet!</p>}
        <Box sx={{ display: processedImages.length > 0 ? "block" : "none"}}>
          <Box>
            <Typography variant="subtitle1">
              Source Images
            </Typography>
            <Card variant="outlined" sx={{ display: "inline-block", margin: "1em 1em 1em 0" }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                  Left
                </Typography>
                <canvas id="left" />
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ display: "inline-block", margin: "1em 1em 1em 0" }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                  Right
                </Typography>
                <canvas id="right" />
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Typography variant="subtitle1">
              Permutations
            </Typography>
            <Box>
              <Button variant="outlined" onClick={() => {downloadAsZip()}}>Download as .zip</Button>
            </Box>
            {processedImages.map((processedImage) => <JonImage source={processedImage.dataUrl} />)}
          </Box>
        </Box>
      </Paper>

    </Container>
  );
}

export default App;

//** garbage */
// Mask border between images
// for(let counter = 0; counter < 4 * imageDataLeft.width * imageDataLeft.height; counter += 4) {
//   const index = Math.round(counter / 4);

//   const x = index % imageDataLeft.width;
//   const y = Math.round(index / imageDataLeft.width);

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
//   const index = Math.round(counter / 4);

//   const x = index % imageDataLeft.width;
//   const y = Math.round(index / imageDataLeft.width);

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