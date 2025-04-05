const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const images = ["img/1.jpg", "img/2.png", "img/rect2.png"];

const checkbox = document.getElementById("scaleCheckbox");

// Utility function to load images
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(`Failed to load image: ${src}`);
    img.src = src;
  });
};

// Load all images and render them on the canvas
const loadAllImages = async () => {
  try {
    const loadedImages = await Promise.all(images.map(loadImage));
    const maxWidth = getMaxWidth(loadedImages);  // Get either max or min width based on checkbox
    const scaleFactors = getScaleFactors(loadedImages, maxWidth);
    const newHeights = calculateNewHeights(loadedImages, scaleFactors);

    setCanvasDimensions(maxWidth, newHeights);
    drawImagesOnCanvas(loadedImages, scaleFactors, maxWidth, newHeights);
  } catch (error) {
    console.error(error);
  }
};

// Get the max or min width of all images based on the checkbox state
const getMaxWidth = (images) => checkbox.checked ? Math.min(...images.map(img => img.width)) : Math.max(...images.map(img => img.width));

// Get scale factors for each image based on max width
const getScaleFactors = (images, maxWidth) => {
  return images.map(img => maxWidth / img.width);
};

// Calculate new heights for each image based on scale factors
const calculateNewHeights = (images, scaleFactors) => {
  return images.map((img, index) => img.height * scaleFactors[index]);
};

// Set the canvas dimensions based on the images
const setCanvasDimensions = (maxWidth, newHeights) => {
  canvas.width = maxWidth;
  canvas.height = newHeights.reduce((acc, height) => acc + height, 0);
};

// Draw all images on the canvas with appropriate scale factors and y-offsets
const drawImagesOnCanvas = (images, scaleFactors, maxWidth, newHeights) => {
  let yOffset = 0;
  images.forEach((img, index) => {
    ctx.drawImage(img, 0, yOffset, maxWidth, newHeights[index]);
    yOffset += newHeights[index]; // Update yOffset for the next image
  });
};

// Start loading the images
loadAllImages();

// Event listener for checkbox state change
checkbox.addEventListener("change", () => {
  loadAllImages();  // Redraw the canvas when the checkbox state changes
});
