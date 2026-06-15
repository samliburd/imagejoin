// Imports
import '../css/base.css';
import '../css/style.scss';

// DOM references
const canvas = document.getElementById('canvas');
const canvasContainer = document.getElementById('canvasContainer');
const ctx = canvas.getContext('2d');
const uploadInput = document.getElementById('upload');
const checkbox = document.getElementById('scaleCheckbox');
const orientation = document.getElementById('orientationDropdown');
const debug = document.getElementById('debug');
const debugContainer = document.getElementById('debugContainer');
const downloadButton = document.getElementById('download');
const imageListContainer = document.getElementById('imageListContainer');
const imageList = document.getElementById('imageList');
const helpText = document.getElementById('helpText');

// Constants
const TEST_IMAGES = [
  'testimg/1.jpg',
  // "testimg/2.png",
  // "testimg/rect.png",
  // "testimg/rect2.png",
  'testimg/triangle.png',
];
const mediaQuery = window.matchMedia('(max-width: 600px)');

debugContainer.style.display = 'none';

// state vars
let loadedImages = [];
let draggedItem = null;
let draggedIndex = null;

// visibility
const showCanvasContainer = () => canvasContainer.classList.remove('hidden');
const hideCanvasContainer = () => canvasContainer.classList.add('hidden');

// inits
hideCanvasContainer();
imageListContainer.classList.add('hidden');

// util functions
const loadImageFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
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
    imageListContainer.classList.add('hidden');
    imageList.innerHTML = '';

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
    console.error('Error loading test images:', err);
  }
};

// Load and draw images from input
const loadAndDrawImages = async (files) => {
  try {
    hideCanvasContainer();
    imageListContainer.classList.add('hidden');
    imageList.innerHTML = '';

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
  if (index <= 0) return;
  [loadedImages[index], loadedImages[index - 1]] = [
    loadedImages[index - 1],
    loadedImages[index],
  ];
  imageList.innerHTML = '';
  createImageThumbnails();
  drawToCanvas();
};

// Move image down in the order
const moveImageDown = (index) => {
  if (index >= loadedImages.length - 1) return;
  [loadedImages[index], loadedImages[index + 1]] = [
    loadedImages[index + 1],
    loadedImages[index],
  ];
  imageList.innerHTML = '';
  createImageThumbnails();
  drawToCanvas();
};

// Utility function to create a thumbnail using a canvas
const createThumbnail = (img, width, height) => {
  const canvasThumbnail = document.createElement('canvas');
  const ctxThumbnail = canvasThumbnail.getContext('2d');
  canvasThumbnail.width = width;
  canvasThumbnail.height = height;
  ctxThumbnail.drawImage(img, 0, 0, width, height);
  return canvasThumbnail.toDataURL('image/jpeg', 0.7);
};

// Create draggable thumbnails
const createImageThumbnails = () => {
  imageListContainer.classList.remove('hidden');

  loadedImages.forEach((img, index) => {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'image-thumbnail';
    thumbnail.draggable = true;
    thumbnail.dataset.index = index;

    const thumbnailSrc = createThumbnail(img, 100, 100);

    const upArrow = document.createElement('button');
    upArrow.className = 'up-arrow';
    upArrow.innerHTML = '&uarr;';
    if (index === 0) {
      upArrow.disabled = true;
      upArrow.classList.add('disabled');
    } else {
      upArrow.disabled = false;
      upArrow.classList.remove('disabled');
    }
    upArrow.addEventListener('click', () => moveImageUp(index));

    const downArrow = document.createElement('button');
    downArrow.className = 'down-arrow';
    downArrow.innerHTML = '&darr;';
    if (index === loadedImages.length - 1) {
      downArrow.disabled = true;
      downArrow.classList.add('disabled');
    } else {
      downArrow.disabled = false;
      downArrow.classList.remove('disabled');
    }
    downArrow.addEventListener('click', () => moveImageDown(index));

    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';

    const imgPreview = document.createElement('img');
    imgPreview.className = 'thumbnail-img';
    imgPreview.src = thumbnailSrc;
    imgPreview.addEventListener('contextmenu', (e) => e.preventDefault());

    const imgName = img.originalName || img.src.split('/').pop();
    const label = document.createElement('span');
    label.className = 'thumbnail-label';
    label.textContent = `${imgName}`;

    previewContainer.appendChild(imgPreview);
    previewContainer.appendChild(label);

    thumbnail.appendChild(upArrow);
    thumbnail.appendChild(previewContainer);
    thumbnail.appendChild(downArrow);
    imageList.appendChild(thumbnail);

    thumbnail.addEventListener('dragstart', handleDragStart);
    thumbnail.addEventListener('dragover', handleDragOver);
    thumbnail.addEventListener('dragend', handleDragEnd);
  });
};

// Drag handlers
const handleDragStart = (e) => {
  draggedItem = e.target.closest('.image-thumbnail');
  draggedIndex = parseInt(draggedItem.dataset.index);
  draggedItem.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', draggedItem);
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const target = e.target.closest('.image-thumbnail');
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
    draggedItem.classList.remove('dragging');
    draggedItem = null;
  }
};

// Update image order after drag
const updateImageOrder = () => {
  const thumbnails = Array.from(imageList.children);
  const newOrder = thumbnails.map(
    (thumb) => loadedImages[parseInt(thumb.dataset.index)]
  );
  loadedImages = newOrder;

  thumbnails.forEach((thumb, index) => {
    thumb.dataset.index = index;
    const upArrow = thumb.querySelector('.up-arrow');
    const downArrow = thumb.querySelector('.down-arrow');

    if (index === 0) {
      upArrow.disabled = true;
      upArrow.classList.add('disabled');
    } else {
      upArrow.disabled = false;
      upArrow.classList.remove('disabled');
    }

    if (index === loadedImages.length - 1) {
      downArrow.disabled = true;
      downArrow.classList.add('disabled');
    } else {
      downArrow.disabled = false;
      downArrow.classList.remove('disabled');
    }
  });

  drawToCanvas();
};

// --- DRAWING LOGIC ---

// Helper to get either min or max of a specific dimension (width or height)
const getBaseDimension = (images, dimension) => {
  const values = images.map((img) => img[dimension]);
  return checkbox.checked ? Math.max(...values) : Math.min(...values);
};

const drawToCanvas = () => {
  if (loadedImages.length === 0) {
    hideCanvasContainer();
    return;
  }

  showCanvasContainer();

  const isPortrait = orientation.value === 'portrait';

  if (isPortrait) {
    // Stack vertically based on a unified width
    const baseWidth = getBaseDimension(loadedImages, 'width');
    const scaleFactors = loadedImages.map((img) => baseWidth / img.width);
    const newHeights = loadedImages.map(
      (img, i) => img.height * scaleFactors[i]
    );

    canvas.width = baseWidth;
    canvas.height = newHeights.reduce((acc, h) => acc + h, 0);

    let yOffset = 0;
    loadedImages.forEach((img, i) => {
      ctx.drawImage(img, 0, yOffset, baseWidth, newHeights[i]);
      yOffset += newHeights[i];
    });
  } else {
    // Stack horizontally based on a unified height
    const baseHeight = getBaseDimension(loadedImages, 'height');
    const scaleFactors = loadedImages.map((img) => baseHeight / img.height);
    const newWidths = loadedImages.map((img, i) => img.width * scaleFactors[i]);

    canvas.height = baseHeight;
    canvas.width = newWidths.reduce((acc, w) => acc + w, 0);

    let xOffset = 0;
    loadedImages.forEach((img, i) => {
      ctx.drawImage(img, xOffset, 0, newWidths[i], baseHeight);
      xOffset += newWidths[i];
    });
  }
};

// Download logic
const downloadImage = () => {
  const filename =
    document.getElementById('filename').value.trim() || 'joinedimage';
  const imageData = canvas.toDataURL('image/jpeg', 0.92);
  const link = document.createElement('a');
  link.href = imageData;
  link.download = `${filename}.jpg`;
  link.click();
};

// Event Listeners
const mediaQueryChange = (e) => {
  if (e.matches) {
    helpText.innerText = 'Use the arrows to adjust image order.';
  } else {
    helpText.innerText = 'Drag images to reorder or use the arrows.';
  }
};
mediaQuery.addEventListener('change', mediaQueryChange);
mediaQueryChange(mediaQuery);

uploadInput.removeEventListener('change', handleUpload);
uploadInput.addEventListener('change', handleUpload);

function handleUpload(e) {
  const files = e.target.files;
  if (files.length) {
    loadAndDrawImages(files);
    e.target.value = '';
  }
}

// Ensure canvas redraws when configuration changes
checkbox.addEventListener('change', drawToCanvas);
orientation.addEventListener('change', drawToCanvas);

downloadButton.addEventListener('click', downloadImage);

debug.addEventListener('change', (e) => {
  if (e.target.checked) {
    loadTestImages();
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hideCanvasContainer();
    imageListContainer.classList.add('hidden');
    imageList.innerHTML = '';
    loadedImages = [];
  }
});

// Load test images if debug is already checked
if (debug.checked) {
  loadTestImages();
}
