import { PixelShape } from "@/App"

const convertToPixelArt = (canvasRef: React.RefObject<HTMLCanvasElement>, image: string | File | Blob, gridWidth: number, gridHeight: number, borderWidth: number, pixelShape: PixelShape) => {
  return new Promise<string>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return reject('Canvas not found')

      const ctx = canvas.getContext('2d')
      if (!ctx) return reject('Could not get 2D context')

      // Set canvas size to match the loaded image
      canvas.width = img.width
      canvas.height = img.height

      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0, img.width, img.height)

      // Create pixel art
      const pixelSize = Math.floor(600 / Math.max(gridWidth, gridHeight)) // Dynamically calculate pixel size
      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = gridWidth * pixelSize + (gridWidth + 1) * borderWidth
      outputCanvas.height = gridHeight * pixelSize + (gridHeight + 1) * borderWidth
      const outputCtx = outputCanvas.getContext('2d')
      if (!outputCtx) return reject('Could not get 2D context for output canvas')

      outputCtx.fillStyle = '#000' // Border color
      outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height)

      // Draw the pixel based on the selected shape

      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          const pixelX = x * pixelSize + (x + 1) * borderWidth;
          const pixelY = y * pixelSize + (y + 1) * borderWidth;


          const sourceX = Math.floor(x * (img.width / gridWidth))
          const sourceY = Math.floor(y * (img.height / gridHeight))
          const [r, g, b] = ctx.getImageData(sourceX, sourceY, 1, 1).data
          outputCtx.fillStyle = `rgb(${r},${g},${b})`

          if (pixelShape === 'square') {
            outputCtx.fillRect(
              x * pixelSize + (x + 1) * borderWidth,
              y * pixelSize + (y + 1) * borderWidth,
              pixelSize,
              pixelSize
            )
          } else if (pixelShape === 'circle') {


            outputCtx.beginPath();
            outputCtx.arc(
              pixelX + pixelSize / 2,
              pixelY + pixelSize / 2,
              pixelSize / 2,
              0,
              Math.PI * 2
            );
            outputCtx.fill();

          }
          else if (pixelShape === 'hexagon') {
            const hexRadius = pixelSize / 2;
            outputCtx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i; // 60 degrees in radians
              const xOffset = pixelX + hexRadius + hexRadius * Math.cos(angle);
              const yOffset = pixelY + hexRadius + hexRadius * Math.sin(angle);
              outputCtx.lineTo(xOffset, yOffset);
            }
            outputCtx.closePath();
            outputCtx.fill();
          }
          else if (pixelShape === 'triangle') {
            outputCtx.beginPath();
            outputCtx.moveTo(pixelX + pixelSize / 2, pixelY);
            outputCtx.lineTo(pixelX + pixelSize, pixelY + pixelSize);
            outputCtx.lineTo(pixelX, pixelY + pixelSize);
            outputCtx.fill();
          }

        }
      }

      resolve(outputCanvas.toDataURL())
    }
    img.onerror = () => reject('Failed to load image')

    if (typeof image === 'string') {
      img.src = image
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(image)
    }
  })
}


export { convertToPixelArt }