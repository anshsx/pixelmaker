"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Appbar from './components/ui/appbar'
import { DownloadIcon } from 'lucide-react'

export default function Component() {
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [gridWidth, setGridWidth] = useState(48)
  const [gridHeight, setGridHeight] = useState(27)
  const [aspectRatio, setAspectRatio] = useState(16 / 9)
  const [borderWidth, setBorderWidth] = useState(1)
  const [pixelArtUrl, setPixelArtUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const convertToPixelArt = useCallback((image: string | File | Blob, gridWidth: number, gridHeight: number, borderWidth: number) => {
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

        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            const sourceX = Math.floor(x * (img.width / gridWidth))
            const sourceY = Math.floor(y * (img.height / gridHeight))
            const [r, g, b] = ctx.getImageData(sourceX, sourceY, 1, 1).data
            outputCtx.fillStyle = `rgb(${r},${g},${b})`
            outputCtx.fillRect(
              x * pixelSize + (x + 1) * borderWidth,
              y * pixelSize + (y + 1) * borderWidth,
              pixelSize,
              pixelSize
            )
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
  }, [])

  const handleConvert = useCallback(async () => {
    try {
      const imageSource = imageFile || imageUrl
      if (!imageSource) {
        alert('Please provide an image URL, file, or paste an image')
        return
      }
      const result = await convertToPixelArt(imageSource, gridWidth, gridHeight, borderWidth)
      setPixelArtUrl(result)
    } catch (error) {
      console.error('Error converting image:', error)
    }
  }, [imageUrl, imageFile, gridWidth, gridHeight, borderWidth, convertToPixelArt])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
      setImageUrl('') // Clear URL input when file is selected
      updateAspectRatio(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImageFile(e.dataTransfer.files[0])
      setImageUrl('') // Clear URL input when file is dropped
      updateAspectRatio(e.dataTransfer.files[0])
    }
  }

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile()
          if (blob) {
            const file = new File([blob], 'pasted-image.png', { type: blob.type })
            setImageFile(file)
            setImageUrl('') // Clear URL input when image is pasted
            updateAspectRatio(file)
          }
          break
        }
      }
    }
  }, [])

  const updateAspectRatio = (file: File) => {
    const img = new Image()
    img.onload = () => {
      const newAspectRatio = img.width / img.height
      setAspectRatio(newAspectRatio)
      setGridWidth(Math.round(gridHeight * newAspectRatio))
    }
    img.src = URL.createObjectURL(file)
  }

  const handleGridWidthChange = (newWidth: number) => {
    setGridWidth(newWidth)
    setGridHeight(Math.round(newWidth / aspectRatio))
  }

  const handleGridHeightChange = (newHeight: number) => {
    setGridHeight(newHeight)
    setGridWidth(Math.round(newHeight * aspectRatio))
  }

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [handlePaste])

  return (
    <div>
    <Appbar/>
      <div className="container mx-auto py-4 min-h-[calc(100vh-64px)] max-w-7xl pt-10 px-4 xl:px-0">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="text"
                placeholder="Enter image URL"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value)
                  setImageFile(null) // Clear file input when URL is entered
                }}
              />
            </div>
            <div
              ref={dropZoneRef}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <p>Drag & drop an image here, click to select, or paste from clipboard</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {imageFile && <p className="mt-2">Selected file: {imageFile.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grid-width">Grid Width</Label>
                <Input
                  id="grid-width"
                  type="number"
                  value={gridWidth}
                  onChange={(e) => handleGridWidthChange(Number(e.target.value))}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grid-height">Grid Height</Label>
                <Input
                  id="grid-height"
                  type="number"
                  value={gridHeight}
                  onChange={(e) => handleGridHeightChange(Number(e.target.value))}
                  min={1}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="border-width">Border Width (px)</Label>
              <Input
                id="border-width"
                type="number"
                value={borderWidth}
                onChange={(e) => setBorderWidth(Number(e.target.value))}
                min={0}
              />
            </div>
            <Button onClick={handleConvert} className="w-full">Convert to Pixel Art</Button>
          </div>
          <div className="w-full lg:w-1/2">
            {pixelArtUrl ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Result:</h3>
                <div className="relative">
                  <img src={pixelArtUrl} alt="Pixel Art" className="w-full border border-gray-300" />
                  <button
                    className="absolute bottom-4 right-4 p-2 bg-secondary/95  hover:bg-secondary rounded-full "
                    onClick={() => {
                      const a = document.createElement('a')
                      a.href = pixelArtUrl
                      a.download = 'pixel-art.png'
                      a.click()
                    }}
                  >
                    <DownloadIcon className=''size={18}/>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border border-gray-300 rounded-lg">
                <p className="text-gray-500">Pixel art preview will appear here</p>
              </div>
            )}
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>  
  )
}