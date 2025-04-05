const canvas = document.getElementById("canvas");
const canvasContainer = document.getElementById("canvasContainer");
const ctx = canvas.getContext("2d");
const uploadInput = document.getElementById("upload");
const checkbox = document.getElementById("scaleCheckbox");
const downloadButton = document.getElementById("download");
const width = document.getElementById("width");
const width2 = document.getElementById("width2");
const controlContainer = document.getElementById("controlContainer");

width2.innerText = `Control width: ${controlContainer.offsetWidth}`

let loadedImages = [];

canvasContainer.classList.add("hidden")

// Utility: Load an image from a File object (via FileReader)
const loadImageFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(`Failed to load image: ${file.name}`);
      img.src = reader.result;
    };
    reader.onerror = () => reject(`Failed to read file: ${file.name}`);
    reader.readAsDataURL(file);
  });
};

// Load images and draw to canvas
const loadAndDrawImages = async (files) => {
  try {
    loadedImages = await Promise.all(Array.from(files).map(loadImageFromFile));
    drawToCanvas();
  } catch (error) {
    console.error(error);
  }
};

// Redraw canvas based on scale setting
const drawToCanvas = () => {
  if (loadedImages.length === 0) return;
  canvasContainer.classList.remove("hidden")

  const maxWidth = getMaxWidth(loadedImages);
  const scaleFactors = getScaleFactors(loadedImages, maxWidth);
  const newHeights = calculateNewHeights(loadedImages, scaleFactors);

  setCanvasDimensions(maxWidth, newHeights);
  drawImagesOnCanvas(loadedImages, scaleFactors, maxWidth, newHeights);
  width.innerText = `Canvas width: ${canvas.offsetWidth}\nCanvas container width: ${canvasContainer.offsetWidth}`;
};

// Get max or min width based on checkbox state
const getMaxWidth = (images) =>
  checkbox.checked
    ? Math.max(...images.map((img) => img.width))
    : Math.min(...images.map((img) => img.width));

// Scale factors per image
const getScaleFactors = (images, baseWidth) =>
  images.map((img) => baseWidth / img.width);

// New image heights based on scale
const calculateNewHeights = (images, scaleFactors) =>
  images.map((img, i) => img.height * scaleFactors[i]);

// Set canvas dimensions
const setCanvasDimensions = (width, heights) => {
  canvas.width = width;
  canvas.height = heights.reduce((acc, h) => acc + h, 0);
};

// Draw images on canvas
const drawImagesOnCanvas = (images, scaleFactors, width, heights) => {
  let yOffset = 0;
  images.forEach((img, i) => {
    ctx.drawImage(img, 0, yOffset, width, heights[i]);
    yOffset += heights[i];
  });
};

// Event: File upload
uploadInput.addEventListener("change", (e) => {
  const files = e.target.files;
  if (files.length) {
    loadAndDrawImages(files);
  }
});

const downloadImage = () => {
  const imageData = canvas.toDataURL("image/jpeg", 0.92); // 92% quality JPEG
  const link = document.createElement("a");
  link.href = imageData;
  link.download = "canvas.jpg";
  link.click();
};

// Event: Download button click
downloadButton.addEventListener("click", downloadImage);

// Event: Scale checkbox changed
checkbox.addEventListener("change", drawToCanvas);
