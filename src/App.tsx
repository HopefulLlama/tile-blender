import React, { useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import ReactImageUploading, { ImageListType, ImageType } from 'react-images-uploading';

function App() {
  const [ images, setImages ] = useState<ImageListType>([]);
  const [ imageResults, setImageResults ] = useState<string[]>([]);

  const canvasRef0 = useRef<HTMLCanvasElement | null>(null);
  const canvasRef1 = useRef<HTMLCanvasElement | null>(null);

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
        
        if(context) {
          context.drawImage(temporaryImage, 0, 0);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          console.log(imageData);
          resolve(imageData);
        }
      };

      if(image.dataURL) {
        temporaryImage.src = image.dataURL;
      }
    });
  };

  const drawImageDataToCanvas = (imageData: ImageData, canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d");

    if(context) {
      context.putImageData(imageData, 0, 0);
      const result = canvas.toDataURL();

      setImageResults([result]);
    }
  };

  const drawSourceAndGetData = (): Promise<ImageData[]> => {
    const canvas0 = canvasRef0.current;
    const canvas1 = canvasRef1.current;

    if(canvas0 && canvas1) {
      const canvases = [canvas0, canvas1];

      const pairs: [HTMLCanvasElement, ImageType][] = canvases.map((canvas, index) => [canvas, images[index]]);
      
      return Promise.all(pairs.map(([canvas, srcImage]) => drawImageToCanvas(srcImage, canvas)));
    } else {
      return Promise.resolve([]);
    }
  };

  const drawResult = (imageData: ImageData[]) => {
    const canvas = document.createElement("canvas");

    const [ imageDataLeft, imageDataRight ] = imageData;

    if(canvas) {
      canvas.width = imageDataLeft.width;
      canvas.height = imageDataRight.height;

      const oneThirdWidth = imageDataLeft.width / 3;
      const oneThirdHeight = imageDataLeft.height / 3;

      const resultPixels: number[] = [];
      for(let counter = 0; counter < 4 * imageDataLeft.width * imageDataLeft.height; counter += 4) {
        const index = Math.floor(counter / 4);

        const x = index % imageDataLeft.width;
        const y = Math.floor(index / imageDataLeft.width);
        const source = x < oneThirdWidth && y < oneThirdHeight ? imageDataLeft : imageDataRight;

        const r = source.data[counter];
        const g = source.data[counter + 1];
        const b = source.data[counter + 2];
        const a = source.data[counter + 3];

        resultPixels.push(r);
        resultPixels.push(g);
        resultPixels.push(b);
        resultPixels.push(a);
      };

      console.log(resultPixels.length);
      const resultClampedArray = new Uint8ClampedArray(resultPixels);
      const resultImageData = new ImageData(resultClampedArray, imageDataLeft.width, imageDataRight.width);
      drawImageDataToCanvas(resultImageData, canvas);
    }
  };

  const doTheThing = async () => {
    const imageData = await drawSourceAndGetData();
    drawResult(imageData);
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
      {imageResults.map((result) => <img src={result}/>)}
    </div>
  );
}

export default App;
