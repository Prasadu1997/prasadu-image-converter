const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const qualityInput = document.getElementById('quality');
const resizeWidthInput = document.getElementById('resizeWidth');
const resizeHeightInput = document.getElementById('resizeHeight');
const outputFormatSelect = document.getElementById('outputFormat');
const uploadZone = document.getElementById('uploadZone');
const statusMessage = document.getElementById('statusMessage');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultArea = document.getElementById('result');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const previewsContainer = document.getElementById('previewsContainer');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const totalSavingsEl = document.getElementById('totalSavings');
const darkModeToggle = document.getElementById('darkModeToggle');

let filesToProcess = [];
let processedBlobs = [];
let originalSizes = [];

// Dark Mode Toggle
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// Enable/disable convert button
function updateConvertButton() {
  convertBtn.disabled = filesToProcess.length === 0;
}

// File input
fileInput.addEventListener('change', handleFiles);
uploadZone.addEventListener('click', () => fileInput.click());

// Drag & drop
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});

function handleFiles(fileList) {
  filesToProcess = Array.from(fileList);
  if (filesToProcess.length > 0) {
    statusMessage.textContent = `${filesToProcess.length} image(s) selected`;
    statusMessage.className = 'status-message status-success';
    updateConvertButton();
  }
}

// Convert button click
convertBtn.addEventListener('click', async () => {
  if (filesToProcess.length === 0) return;

  resultArea.style.display = 'none';
  loadingSpinner.style.display = 'block';
  progressContainer.style.display = 'block';
  convertBtn.disabled = true;
  statusMessage.textContent = 'Processing images...';

  previewsContainer.innerHTML = '';
  processedBlobs = [];
  originalSizes = [];
  let totalOriginalSize = 0;
  let totalNewSize = 0;

  progressBar.value = 0;
  progressText.textContent = '0%';

  const quality = parseFloat(qualityInput.value) || 0.8;
  const format = outputFormatSelect.value;
  const width = parseInt(resizeWidthInput.value) || null;
  const height = parseInt(resizeHeightInput.value) || null;

  for (let i = 0; i < filesToProcess.length; i++) {
    const file = filesToProcess[i];
    try {
      const img = await loadImage(file);
      const originalSize = file.size;
      totalOriginalSize += originalSize;

      // Resize canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let newWidth = width || img.width;
      let newHeight = height || img.height;

      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, `image/${format}`, quality);
      });

      totalNewSize += blob.size;
      processedBlobs.push(blob);

      // Show preview
      const item = document.createElement('div');
      item.className = 'preview-item';
      item.innerHTML = `
        <strong>${file.name}</strong><br>
        <div class="images-row">
          <img src="${URL.createObjectURL(file)}" alt="Original">
          <div class="converted-wrapper">
            <img src="${URL.createObjectURL(blob)}" alt="Converted">
            <a href="${URL.createObjectURL(blob)}" class="download-single" download="${file.name.split('.')[0]}.${format}">Download</a>
          </div>
        </div>
        <small>Original: ${(originalSize / 1024).toFixed(1)} KB → New: ${(blob.size / 1024).toFixed(1)} KB</small>
      `;
      previewsContainer.appendChild(item);

      // Update progress
      progressBar.value = ((i + 1) / filesToProcess.length) * 100;
      progressText.textContent = `${Math.round(progressBar.value)}%`;
    } catch (err) {
      console.error(err);
      statusMessage.textContent = `Error processing ${file.name}`;
    }
  }

  loadingSpinner.style.display = 'none';
  resultArea.style.display = 'block';
  progressContainer.style.display = 'none';
  convertBtn.disabled = false;

  const savings = totalOriginalSize - totalNewSize;
  const savingsPercent = totalOriginalSize > 0 ? ((savings / totalOriginalSize) * 100).toFixed(1) : 0;
  totalSavingsEl.textContent = `Saved ${Math.round(savings / 1024)} KB (${savingsPercent}%)`;

  downloadAllBtn.onclick = () => downloadAll(processedBlobs, filesToProcess, format);
});

// Download all as ZIP
function downloadAll(blobs, files, format) {
  const zip = new JSZip();
  blobs.forEach((blob, i) => {
    const file = files[i];
    const name = `${file.name.split('.')[0]}.${format}`;
    zip.file(name, blob);
  });

  zip.generateAsync({type:"blob"}).then(content => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `converted_images.${format === 'jpeg' ? 'zip' : format}`;
    link.click();
  });
}

// Load image helper
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}