const fileInput = document.getElementById('fileInput');
const qualityInput = document.getElementById('quality');
const resizePercentInput = document.getElementById('resizePercent');
const outputFormat = document.getElementById('outputFormat');
const convertBtn = document.getElementById('convertBtn');
const uploadZone = document.getElementById('uploadZone');
const statusMessage = document.getElementById('statusMessage');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultArea = document.getElementById('result');
const previewsContainer = document.getElementById('previewsContainer');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const totalSavings = document.getElementById('totalSavings');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const darkModeToggle = document.getElementById('darkModeToggle');

let convertedFiles = [];

// Dark Mode Toggle
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// Upload handling
uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    handleFiles();
  }
});

fileInput.addEventListener('change', handleFiles);

function handleFiles() {
  const files = Array.from(fileInput.files);
  if (files.length === 0) return;

  const valid = files.filter(f => f.type.startsWith('image/'));
  if (valid.length === 0) {
    statusMessage.textContent = "Please select image files only!";
    statusMessage.className = 'status-message';
    convertBtn.disabled = true;
    return;
  }

  statusMessage.textContent = `${valid.length} image${valid.length > 1 ? 's' : ''} loaded successfully! Ready to convert.`;
  statusMessage.className = 'status-message status-success';
  convertBtn.disabled = false;
}

convertBtn.addEventListener('click', async () => {
  const files = Array.from(fileInput.files);
  if (files.length === 0) return;

  resultArea.style.display = 'none';
  loadingSpinner.style.display = 'block';
  progressContainer.style.display = 'block';
  convertBtn.disabled = true;
  statusMessage.textContent = `Preparing ${files.length} file${files.length > 1 ? 's' : ''}...`;

  previewsContainer.innerHTML = '';
  convertedFiles = [];
  let totalOriginal = 0;
  let totalConverted = 0;
  let processed = 0;

  progressBar.value = 0;
  progressText.textContent = `Converting 0 of ${files.length} files (0%)`;

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;

    const item = document.createElement('div');
    item.className = 'preview-item';
    item.innerHTML = `
      <strong>${file.name}</strong><br>
      <div class="images-row">
        <img src="" alt="Original" style="opacity:0.4;">
        <div class="converted-wrapper">
          <img src="" alt="Converted" style="opacity:0.4;">
        </div>
      </div>
      <div class="file-progress-container">
        <div class="file-progress-bar file-progress-indeterminate"></div>
      </div>
      <small>Processing...</small>
    `;
    previewsContainer.appendChild(item);

    const originalSizeKB = file.size / 1024;
    totalOriginal += originalSizeKB;

    processed++;
    const percent = Math.round((processed / files.length) * 100);
    progressText.textContent = `Converting ${processed} of ${files.length} files (${percent}%)`;
    progressBar.value = percent;

    const reader = new FileReader();
    await new Promise(resolve => {
      reader.onload = (e) => {
        const imgEl = item.querySelector('img[alt="Original"]');
        imgEl.src = e.target.result;
        imgEl.style.opacity = '1';

        const img = new Image();
        img.onload = () => {
          const resizePercent = parseFloat(resizePercentInput.value) || 100;
          const newWidth = Math.round(img.width * (resizePercent / 100));
          const newHeight = Math.round(img.height * (resizePercent / 100));

          const canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          const quality = parseFloat(qualityInput.value) || 0.8;
          const format = outputFormat.value;
          let mime = '';
          switch (format) {
            case 'webp': mime = 'image/webp'; break;
            case 'avif': mime = 'image/avif'; break;
            case 'jpeg': mime = 'image/jpeg'; break;
            case 'png': mime = 'image/png'; break;
            case 'gif': mime = 'image/gif'; break;
          }
          const dataUrl = canvas.toDataURL(mime, quality);

          const convertedSizeKB = (dataUrl.length * 3 / 4) / 1024;
          totalConverted += convertedSizeKB;

          const progBar = item.querySelector('.file-progress-bar');
          progBar.classList.remove('file-progress-indeterminate');
          progBar.classList.add('file-complete');

          item.querySelector('small').textContent = `Saved ≈ ${Math.round((1 - convertedSizeKB / originalSizeKB) * 100)}%`;

          const convertedImg = item.querySelector('img[alt="Converted"]');
          convertedImg.src = dataUrl;
          convertedImg.style.opacity = '1';

          const dlLink = document.createElement('a');
          dlLink.href = dataUrl;
          dlLink.download = file.name.replace(/\.\w+$/i, `.${format}`);
          dlLink.textContent = `Download ${format.toUpperCase()}`;
          dlLink.className = 'download-single';
          item.querySelector('.converted-wrapper').appendChild(dlLink);

          convertedFiles.push({ name: file.name.replace(/\.\w+$/i, `.${format}`), dataUrl });

          resolve();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const savingsPercent = totalOriginal > 0 ? Math.round(((totalOriginal - totalConverted) / totalOriginal) * 100) : 0;
  totalSavings.textContent = `Total saved ≈ ${savingsPercent}% (${Math.round(totalOriginal)} KB → ${Math.round(totalConverted)} KB)`;

  downloadAllBtn.onclick = async () => {
    const zip = new JSZip();
    convertedFiles.forEach(f => {
      const base64 = f.dataUrl.split(',')[1];
      zip.file(f.name, base64, {base64: true});
    });
    const blob = await zip.generateAsync({type: "blob"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-images.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  loadingSpinner.style.display = 'none';
  resultArea.style.display = 'block';
  progressContainer.style.display = 'none';
  statusMessage.textContent = "All conversions complete!";
  convertBtn.disabled = false;
});