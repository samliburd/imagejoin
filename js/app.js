// Imports
import "../css/base.css"
import "../css/style.scss"

// DOM references
const canvas = document.getElementById("canvas");
const canvasContainer = document.getElementById("canvasContainer");
const ctx = canvas.getContext("2d");
const uploadInput = document.getElementById("upload");
const checkbox = document.getElementById("scaleCheckbox");
const debug = document.getElementById("debug");
const debugContainer = document.getElementById("debugContainer");
const downloadButton = document.getElementById("download");
const imageListContainer = document.getElementById("imageListContainer");
const imageList = document.getElementById("imageList");
const helpText = document.getElementById("helpText");

// Constants
const TEST_IMAGES = [
  "testimg/1.jpg",
  // "testimg/2.png",
  // "testimg/rect.png",
  // "testimg/rect2.png",
  "testimg/triangle.png"
];
const mediaQuery = window.matchMedia('(max-width: 600px)')

debugContainer.style.display = "none";

// State
let loadedImages = [];
let draggedItem = null;
let draggedIndex = null;

// Visibility control
const showCanvasContainer = () => canvasContainer.classList.remove("hidden");
const hideCanvasContainer = () => canvasContainer.classList.add("hidden");

// Init state
hideCanvasContainer();
imageListContainer.classList.add("hidden");

// Utility: Load image from file
const loadImageFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Store the original file name as a property on the image object
        img.originalName = file.name;
        resolve(img);
      };
      img.onerror = () => reject(`Failed to load image: ${file.name}`);
      img.src = reader.result;
    };
    reader.onerror = () => reject(`Failed to read file: ${file.name}`);
    reader.readAsDataURL(file);
  });
};

// Utility: Load test images
const loadTestImages = async () => {
  try {
    hideCanvasContainer();
    imageListContainer.classList.add("hidden");
    imageList.innerHTML = "";

    loadedImages = await Promise.all(
      TEST_IMAGES.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(`Failed to load image: ${src}`);
          img.src = src;
        });
      })
    );

    if (loadedImages.length > 0) {
      createImageThumbnails();
      drawToCanvas();
    }
  } catch (err) {
    console.error("Error loading test images:", err);
  }
};

// Load and draw images from input
const loadAndDrawImages = async (files) => {
  try {
    hideCanvasContainer();
    imageListContainer.classList.add("hidden");
    imageList.innerHTML = "";

    loadedImages = await Promise.all(Array.from(files).map(loadImageFromFile));

    if (loadedImages.length > 0) {
      createImageThumbnails();
      drawToCanvas();
    } else {
      hideCanvasContainer();
    }
  } catch (error) {
    console.error(error);
    hideCanvasContainer();
  }
};

// Move image up in the order
const moveImageUp = (index) => {
  if (index <= 0) return; // Can't move first item up

  // Swap images in the loadedImages array
  [loadedImages[index], loadedImages[index - 1]] = [loadedImages[index - 1], loadedImages[index]];
  // Rebuild the thumbnails to reflect the new order
  imageList.innerHTML = "";
  createImageThumbnails();


  // Redraw canvas with new order
  drawToCanvas();
};

// Move image down in the order
const moveImageDown = (index) => {
  if (index >= loadedImages.length - 1) return; // Can't move last item down

  // Swap images in the loadedImages array
  [loadedImages[index], loadedImages[index + 1]] = [loadedImages[index + 1], loadedImages[index]];

  // Rebuild the thumbnails to reflect the new order
  imageList.innerHTML = "";
  createImageThumbnails();

  // Redraw canvas with new order
  drawToCanvas();
};

// Create draggable thumbnails
const createImageThumbnails = () => {
  imageListContainer.classList.remove("hidden");

  loadedImages.forEach((img, index) => {
    const thumbnail = document.createElement("div");
    thumbnail.className = "image-thumbnail";
    thumbnail.draggable = true;
    thumbnail.dataset.index = index;

    const upArrow = document.createElement("button");
    upArrow.className = "up-arrow";
    upArrow.innerHTML = "&uarr;";
    if (index === 0) {
      upArrow.disabled = true;
      upArrow.classList.add('disabled');
    } else if (index > 0) {
      upArrow.disabled = false;
      upArrow.classList.remove('disabled');
    }
    upArrow.addEventListener("click", () => {
      moveImageUp(index);
    });

    const downArrow = document.createElement("button");
    downArrow.className = "down-arrow";
    downArrow.innerHTML = "&darr;";
    if (index === loadedImages.length - 1) {
      downArrow.disabled = true;
      downArrow.classList.add('disabled');
    } else if (index < loadedImages.length - 1) {
      downArrow.disabled = false;
      downArrow.classList.remove('disabled');
    }
    downArrow.addEventListener("click", () => {
      moveImageDown(index);
    });

    const previewContainer = document.createElement("div");
    previewContainer.className = "preview-container";

    const imgPreview = document.createElement("img");
    imgPreview.className = "thumbnail-img";
    imgPreview.src = img.src;

    const imgName = img.originalName || img.src.split('/').pop();
    const label = document.createElement("span");
    label.className = "thumbnail-label";
    label.textContent = `${imgName}`;

    previewContainer.appendChild(imgPreview);
    previewContainer.appendChild(label);

    thumbnail.appendChild(upArrow);
    thumbnail.appendChild(previewContainer);
    thumbnail.appendChild(downArrow);
    imageList.appendChild(thumbnail);

    thumbnail.addEventListener("dragstart", handleDragStart);
    thumbnail.addEventListener("dragover", handleDragOver);
    thumbnail.addEventListener("dragend", handleDragEnd);
  });
};

// Drag handlers
const handleDragStart = (e) => {
  draggedItem = e.target.closest(".image-thumbnail");
  draggedIndex = parseInt(draggedItem.dataset.index);
  draggedItem.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/html", draggedItem);
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";

  const target = e.target.closest(".image-thumbnail");
  if (!target || target === draggedItem) return;

  const targetIndex = parseInt(target.dataset.index);
  if (draggedIndex < targetIndex) {
    imageList.insertBefore(draggedItem, target.nextSibling);
  } else {
    imageList.insertBefore(draggedItem, target);
  }

  updateImageOrder();
};

const handleDragEnd = () => {
  if (draggedItem) {
    draggedItem.classList.remove("dragging");
    draggedItem = null;
  }
};

// Update image order after drag
const updateImageOrder = () => {
  // Get new order based on the current DOM arrangement
  const thumbnails = Array.from(imageList.children);
  const newOrder = thumbnails.map((thumb) =>
    loadedImages[parseInt(thumb.dataset.index)]
  );
  loadedImages = newOrder;

  // Update indices and arrow states
  thumbnails.forEach((thumb, index) => {
    // Update index data attribute
    thumb.dataset.index = index;

    // Get the up and down arrow buttons
    const upArrow = thumb.querySelector(".up-arrow");
    const downArrow = thumb.querySelector(".down-arrow");

    // Update up arrow state
    if (index === 0) {
      upArrow.disabled = true;
      upArrow.classList.add('disabled');
    } else if (index !== 0) {
      upArrow.disabled = false;
      upArrow.classList.remove('disabled');
    }

    // Update down arrow state
    if (index === loadedImages.length - 1) {
      downArrow.disabled = true;
      downArrow.classList.add('disabled');
    } else if (index !== loadedImages.length - 1) {
      downArrow.disabled = false;
      downArrow.classList.remove('disabled');
    }
  });

  // Redraw the canvas with the new order
  drawToCanvas();
};

// Drawing functions
const drawToCanvas = () => {
  if (loadedImages.length === 0) {
    hideCanvasContainer();
    return;
  }

  showCanvasContainer();

  const maxWidth = getMaxWidth(loadedImages);
  const scaleFactors = getScaleFactors(loadedImages, maxWidth);
  const newHeights = calculateNewHeights(loadedImages, scaleFactors);

  setCanvasDimensions(maxWidth, newHeights);
  drawImagesOnCanvas(loadedImages, scaleFactors, maxWidth, newHeights);
};

const getMaxWidth = (images) =>
  checkbox.checked
    ? Math.max(...images.map((img) => img.width))
    : Math.min(...images.map((img) => img.width));

const getScaleFactors = (images, baseWidth) =>
  images.map((img) => baseWidth / img.width);

const calculateNewHeights = (images, scaleFactors) =>
  images.map((img, i) => img.height * scaleFactors[i]);

const setCanvasDimensions = (width, heights) => {
  canvas.width = width;
  canvas.height = heights.reduce((acc, h) => acc + h, 0);
};

const drawImagesOnCanvas = (images, scaleFactors, width, heights) => {
  let yOffset = 0;
  images.forEach((img, i) => {
    ctx.drawImage(img, 0, yOffset, width, heights[i]);
    yOffset += heights[i];
  });
};

// Download logic
const downloadImage = () => {
  const filename = document.getElementById("filename").value.trim() || "joinedimage";
  const imageData = canvas.toDataURL("image/jpeg", 0.92);
  const link = document.createElement("a");
  link.href = imageData;
  link.download = `${filename}.jpg`;
  link.click();
};

// Event Listeners
const mediaQueryChange = (e) => {
  if (e.matches) {
    helpText.innerText = "Use the arrows to adjust image order."
  } else {
    helpText.innerText = "Drag images to reorder or use the arrows."
  }
}
mediaQuery.addEventListener("change", mediaQueryChange)
mediaQueryChange(mediaQuery)

uploadInput.removeEventListener('change', handleUpload);
// Then add the new one
uploadInput.addEventListener('change', handleUpload);

function handleUpload(e) {
  const files = e.target.files;
  if (files.length) {
    loadAndDrawImages(files);
    // Clear the input after processing
    e.target.value = '';
  }
}

checkbox.addEventListener("change", drawToCanvas);

downloadButton.addEventListener("click", downloadImage);

debug.addEventListener("change", (e) => {
  if (e.target.checked) {
    loadTestImages();
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hideCanvasContainer();
    imageListContainer.classList.add("hidden");
    imageList.innerHTML = "";
    loadedImages = [];
  }
});

// Load test images if debug is already checked
if (debug.checked) {
  loadTestImages();
}
