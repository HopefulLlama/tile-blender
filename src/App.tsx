import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import ReactImageUploading, { ImageListType, ImageType } from 'react-images-uploading';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { ImageList, ImageListItem } from '@mui/material';
import { segments } from './utils/Segment';

// @ts-ignore
// eslint-disable-next-line
import worker from 'workerize-loader!./worker/worker'

function App() {
  const [uploadedImages, setUploadedImages] = useState<ImageListType>([]);
  const [imageResults, setImageResults] = useState<string[]>([]);

  const canvasLeftRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRightRef = useRef<HTMLCanvasElement | null>(null);

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
      canvasLeftRef.current = document.getElementById("0") as HTMLCanvasElement;
      canvasRightRef.current = document.getElementById("1") as HTMLCanvasElement;
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

  const processImageWithWorker = async (permutation: number[], imageDataLeft: ImageData, imageDataRight: ImageData): Promise<ImageData> => {
    const imageProcessWorker = worker();
    const result = await imageProcessWorker.processImage(permutation, imageDataLeft, imageDataRight);
    imageProcessWorker.terminate();

    return result;
  };

  const getProcessedImageDatum = (imageData: ImageData[]): Promise<string[]> => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return Promise.resolve([]);
    }
    const [imageDataLeft, imageDataRight] = imageData;

    canvas.width = imageDataLeft.width;
    canvas.height = imageDataRight.height;

    return Promise.all(permutations.map(async (permutation) => {
      const resultImageData = await processImageWithWorker(permutation, imageDataLeft, imageDataRight);
      context.putImageData(resultImageData, 0, 0);
      const dataUrl = canvas.toDataURL();

      return dataUrl;
    }));
  };

  const processImages = async () => {
    const canvasLeft = canvasLeftRef.current;
    const canvasRight = canvasRightRef.current;

    if (canvasLeft && canvasRight) {
      await drawSourceImages([canvasLeft, canvasRight], uploadedImages);

      const imageDataLeft = getImageDataFromCanvas(canvasLeft);
      const imageDataRight = getImageDataFromCanvas(canvasRight);

      if (imageDataLeft && imageDataRight) {
        const results = await getProcessedImageDatum([imageDataLeft, imageDataRight]);
        setImageResults(results);
      }
    }
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
          onImageRemoveAll,
          onImageUpdate,
          onImageRemove,
          isDragging,
          dragProps
        }) => (
          <Card variant="outlined" sx={{ marginTop: '1em', marginBottom: '1em'}}>
            <Typography variant="h6">
              Upload Images
            </Typography>

            Upload two images, and press process to get all permutations.

            <Box>
              <Button
                variant="text"
                style={isDragging ? { color: "red" } : undefined}
                disabled={imageList.length === 2}
                onClick={onImageUpload}
                {...dragProps}
              >
                Click or Drop here
              </Button>
              {imageList.length > 0 && <Button variant="outlined" onClick={onImageRemoveAll}>Remove all images</Button>}
            </Box>
            <Box>
              {imageList.map((image, index) => (
                <Card variant="outlined" sx={{ display: "inline-block" }}>
                  <CardContent>
                    <Typography gutterBottom sx={{ color: 'text.secondary' }}>
                      { index === 0 ? 'Left' : 'Right'}
                    </Typography>
                    <img src={image.dataURL} />
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={(() => onImageUpdate(index))}>Update</Button>
                    <Button size="small" onClick={(() => onImageRemove(index))}>Remove</Button>
                  </CardActions>
                </Card>
              ))}
            </Box>

            <Button variant='contained' disabled={imageList.length < 2} onClick={() => processImages()}>Process Images</Button>
          </Card>
        )}
      </ReactImageUploading>

      <Card variant="outlined" sx={{ marginTop: '1em', marginBottom: '1em'}}>
        <Typography variant="h6">
          Results
        </Typography>

        {imageResults.length === 0 && <p>No results yet!</p>}
        <Box sx={{ display: imageResults.length > 0 ? "block" : "none"}}>
          <Box>
            <Typography variant="h6">
              Source Images
            </Typography>
            <Card sx={{ display: "inline-block" }}>
              <CardContent>
                <Typography gutterBottom sx={{ color: 'text.secondary' }}>
                  Left
                </Typography>
                <canvas id="0" />
              </CardContent>
            </Card>
            <Card sx={{ display: "inline-block" }}>
              <CardContent>
                <Typography gutterBottom sx={{ color: 'text.secondary' }}>
                  Right
                </Typography>
                <canvas id="1" />
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Typography variant="h6">
              Permutations
            </Typography>
            <ImageList cols={8}>
              {imageResults.map((result) => <ImageListItem key={result}>
                <img src={result} />
              </ImageListItem>)}
            </ImageList>
          </Box>
        </Box>
      </Card>

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