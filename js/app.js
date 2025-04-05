const canvas = document.getElementById("canvas");
const canvasContainer = document.getElementById("canvasContainer");
const ctx = canvas.getContext("2d");
const uploadInput = document.getElementById("upload");
const checkbox = document.getElementById("scaleCheckbox");
const downloadButton = document.getElementById("download");
const imageListContainer = document.getElementById("imageListContainer");
const imageList = document.getElementById("imageList");

let loadedImages = [];
let draggedItem = null;
let draggedIndex = null;
let touchStartY = 0;
let touchOffsetY = 0;

// Visibility control functions
const showCanvasContainer = () => canvasContainer.classList.remove("hidden");
const hideCanvasContainer = () => canvasContainer.classList.add("hidden");

// Initialize with hidden containers
hideCanvasContainer();
imageListContainer.classList.add("hidden");

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

// Create draggable thumbnails
const createImageThumbnails = () => {
  imageListContainer.classList.remove("hidden");

  loadedImages.forEach((img, index) => {
    const thumbnail = document.createElement("div");
    thumbnail.className = "image-thumbnail";
    thumbnail.draggable = true;
    thumbnail.dataset.index = index;

    const imgPreview = document.createElement("img");
    imgPreview.src = img.src;

    const label = document.createElement("span");
    label.textContent = `Image ${index + 1}`;

    thumbnail.appendChild(imgPreview);
    thumbnail.appendChild(label);
    imageList.appendChild(thumbnail);

    // Add drag events
    thumbnail.addEventListener("dragstart", handleDragStart);
    thumbnail.addEventListener("dragover", handleDragOver);
    thumbnail.addEventListener("dragend", handleDragEnd);
    thumbnail.addEventListener("touchstart", handleTouchStart, { passive: false });
    thumbnail.addEventListener("touchmove", handleTouchMove, { passive: false });
    thumbnail.addEventListener("touchend", handleTouchEnd);
  });
};

// Desktop drag handlers
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

// Mobile touch handlers
const handleTouchStart = (e) => {
  e.preventDefault();
  draggedItem = e.target.closest(".image-thumbnail");
  draggedIndex = parseInt(draggedItem.dataset.index);
  draggedItem.classList.add("dragging");
  touchStartY = e.touches[0].clientY;
  touchOffsetY = touchStartY - draggedItem.getBoundingClientRect().top;
};

const handleTouchMove = (e) => {
  e.preventDefault();
  if (!draggedItem) return;

  const y = e.touches[0].clientY;
  draggedItem.style.position = "relative";
  draggedItem.style.top = `${y - touchOffsetY}px`;

  const thumbnails = Array.from(imageList.children);
  const currentPos = y;

  for (let i = 0; i < thumbnails.length; i++) {
    if (thumbnails[i] === draggedItem) continue;

    const rect = thumbnails[i].getBoundingClientRect();
    const middle = rect.top + rect.height / 2;

    if (currentPos < middle && draggedIndex > i) {
      imageList.insertBefore(draggedItem, thumbnails[i]);
      updateImageOrder();
      break;
    } else if (currentPos > middle && draggedIndex < i) {
      imageList.insertBefore(draggedItem, thumbnails[i].nextSibling);
      updateImageOrder();
      break;
    }
  }
};

const handleTouchEnd = () => {
  if (draggedItem) {
    draggedItem.classList.remove("dragging");
    draggedItem.style.position = "";
    draggedItem.style.top = "";
    draggedItem = null;
  }
};

// Update the loadedImages array when order changes
const updateImageOrder = () => {
  const newOrder = Array.from(imageList.children).map(thumb =>
    loadedImages[parseInt(thumb.dataset.index)]
  );
  loadedImages = newOrder;

  // Update the data-index attributes
  imageList.querySelectorAll(".image-thumbnail").forEach((thumb, index) => {
    thumb.dataset.index = index;
  });

  // Redraw canvas with new order
  drawToCanvas();
};

// Redraw canvas based on scale setting
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
  const filename = document.getElementById("filename").value.trim() || "joinedimage";
  const imageData = canvas.toDataURL("image/jpeg", 0.92);
  const link = document.createElement("a");
  link.href = imageData;
  link.download = `${filename}.jpg`;
  link.click();
};

// Event: Download button click
downloadButton.addEventListener("click", downloadImage);

// Event: Scale checkbox changed
checkbox.addEventListener("change", drawToCanvas);
