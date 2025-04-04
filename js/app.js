const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d");
// const images = ['img/triangle.png', 'img/rect.png', 'img/rect2.png'];
const images = ["img/1.jpg", "img/2.png", "img/rect2.png"];

const loadedImages = [];

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);  // Resolving the promise when image is loaded
    img.onerror = () => reject(`Failed to load image: ${src}`);
    img.src = src;
  });
};

const loadAllImages = async () => {
  try {
    // Use Promise.all to load all images concurrently
    const imagesArray = await Promise.all(images.map(loadImage));
    loadedImages.push(...imagesArray)
    const maxWidth = Math.max(...loadedImages.map(img => img.width));
    const scaleFactors = getScaleFactors(loadedImages);
    const imageHeights = [...loadedImages.map(img => img.height)]
    const newHeights = imageHeights.map((height, index) => {
      return height * scaleFactors[index]
    })
    canvas.height = newHeights.reduce((accumulator, currentValue) => accumulator + currentValue, 0,)
    canvas.width = maxWidth
    let yOffset = 0;
    loadedImages.forEach((img, index) => {
      ctx.drawImage(img, 0, yOffset, maxWidth, img.height * scaleFactors[index]);
      yOffset += img.height * scaleFactors[index];

    });

  } catch (error) {
    console.error(error);
  }
};

const getScaleFactors = (images) => {
  const maxWidth = Math.max(...images.map(img => img.width));
  return images.map(img => maxWidth / img.width);
};

// Start loading the images
loadAllImages();

