/* =============================================
   OcrVision – Application Logic (app.js)
   ============================================= */

'use strict';

// ─── DOM References ───────────────────────────
const dropZone          = document.getElementById('dropZone');
const fileInput         = document.getElementById('fileInput');
const browseLink        = document.getElementById('browseLink');
const dropZoneContent   = document.getElementById('dropZoneContent');
const imagePreviewWrapper = document.getElementById('imagePreviewWrapper');
const imagePreview      = document.getElementById('imagePreview');
const clearImageBtn     = document.getElementById('clearImageBtn');
const convertBtn        = document.getElementById('convertBtn');
const btnText           = convertBtn.querySelector('.btn-text');
const btnLoading        = convertBtn.querySelector('.btn-loading');
const progressContainer = document.getElementById('progressContainer');
const progressFill      = document.getElementById('progressFill');
const progressStatus    = document.getElementById('progressStatus');
const progressPercent   = document.getElementById('progressPercent');
const outputText        = document.getElementById('outputText');
const outputPlaceholder = document.getElementById('outputPlaceholder');
const outputFooter      = document.getElementById('outputFooter');
const wordCount         = document.getElementById('wordCount');
const charCount         = document.getElementById('charCount');
const copyBtn           = document.getElementById('copyBtn');
const downloadBtn       = document.getElementById('downloadBtn');
const clearTextBtn      = document.getElementById('clearTextBtn');
const languageSelect    = document.getElementById('languageSelect');
const toast             = document.getElementById('toast');
const toastMessage      = document.getElementById('toastMessage');
const navbar            = document.getElementById('navbar');

// ─── State ────────────────────────────────────
let currentFile = null;
let toastTimeout = null;

// ─── Navbar Scroll Effect ─────────────────────
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ─── Background Particle System ───────────────
(function initParticles() {
  const container = document.getElementById('bgParticles');
  const count = 25;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 4 + 1;
    const colors = [
      'rgba(124,58,237,0.6)',
      'rgba(59,130,246,0.6)',
      'rgba(34,211,238,0.5)',
      'rgba(167,139,250,0.5)',
    ];
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${Math.random() * 20 + 15}s;
      animation-delay: ${Math.random() * 15}s;
    `;
    container.appendChild(p);
  }
})();

// ─── Scroll Reveal Animation ──────────────────
(function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.feature-card, .step, .step-connector').forEach((el) => {
    el.style.opacity = '0';
    observer.observe(el);
  });
})();

// ─── Drag & Drop ──────────────────────────────
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    loadFile(file);
  } else {
    showToast('Please drop a valid image file.', 'error');
  }
});

dropZone.addEventListener('click', (e) => {
  if (!e.target.closest('#imagePreviewWrapper')) {
    fileInput.click();
  }
});

browseLink.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) loadFile(file);
  fileInput.value = '';
});

// ─── Load & Preview File ──────────────────────
function loadFile(file) {
  currentFile = file;
  const url = URL.createObjectURL(file);
  imagePreview.src = url;
  imagePreview.onload = () => URL.revokeObjectURL(url);

  dropZoneContent.style.display = 'none';
  imagePreviewWrapper.style.display = 'flex';
  clearImageBtn.style.display = 'flex';
  convertBtn.disabled = false;

  // Reset output if switching image
  resetOutput();
}

// ─── Clear Image ──────────────────────────────
clearImageBtn.addEventListener('click', () => {
  currentFile = null;
  imagePreview.src = '';
  dropZoneContent.style.display = 'block';
  imagePreviewWrapper.style.display = 'none';
  clearImageBtn.style.display = 'none';
  convertBtn.disabled = true;
  resetOutput();
});

// ─── Reset Output Area ────────────────────────
function resetOutput() {
  outputText.style.display = 'none';
  outputText.value = '';
  outputPlaceholder.style.display = 'flex';
  outputFooter.style.display = 'none';
  progressContainer.style.display = 'none';
  progressFill.style.width = '0%';
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  clearTextBtn.disabled = true;
}

// ─── OCR Conversion ───────────────────────────
convertBtn.addEventListener('click', runOCR);

async function runOCR() {
  if (!currentFile) return;

  const lang = languageSelect.value;

  // UI: processing state
  btnText.style.display = 'none';
  btnLoading.style.display = 'flex';
  convertBtn.disabled = true;
  progressContainer.style.display = 'block';
  outputPlaceholder.style.display = 'none';
  outputText.style.display = 'none';
  progressFill.style.width = '0%';

  try {
    const result = await Tesseract.recognize(currentFile, lang, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const pct = Math.round(m.progress * 100);
          progressFill.style.width = pct + '%';
          progressPercent.textContent = pct + '%';
          progressStatus.textContent = 'Recognizing text...';
        } else if (m.status === 'loading tesseract core') {
          progressStatus.textContent = 'Loading OCR engine...';
          progressFill.style.width = '10%';
          progressPercent.textContent = '10%';
        } else if (m.status === 'initializing api') {
          progressStatus.textContent = 'Initializing...';
          progressFill.style.width = '30%';
          progressPercent.textContent = '30%';
        } else if (m.status === 'loading language traineddata') {
          progressStatus.textContent = `Loading language data (${lang})...`;
          progressFill.style.width = '50%';
          progressPercent.textContent = '50%';
        }
      },
    });

    const text = result.data.text.trim();
    progressFill.style.width = '100%';
    progressPercent.textContent = '100%';
    progressStatus.textContent = 'Done!';

    setTimeout(() => {
      progressContainer.style.display = 'none';
      outputText.style.display = 'block';
      outputText.value = text || '(No text detected in this image)';
      outputFooter.style.display = 'block';

      // Word & char counts
      const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
      const chars = text ? text.length : 0;
      wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
      charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;

      copyBtn.disabled = !text;
      downloadBtn.disabled = !text;
      clearTextBtn.disabled = !text;
    }, 500);

  } catch (err) {
    progressContainer.style.display = 'none';
    outputPlaceholder.style.display = 'flex';
    showToast('OCR failed. Please try again with a clearer image.', 'error');
    console.error('OCR Error:', err);
  } finally {
    btnText.style.display = 'flex';
    btnLoading.style.display = 'none';
    convertBtn.disabled = false;
  }
}

// ─── Copy to Clipboard ────────────────────────
copyBtn.addEventListener('click', async () => {
  const text = outputText.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast('Text copied to clipboard!', 'success');
  } catch {
    // Fallback
    outputText.select();
    document.execCommand('copy');
    showToast('Text copied!', 'success');
  }
});

// ─── Download as .txt ─────────────────────────
downloadBtn.addEventListener('click', () => {
  const text = outputText.value;
  if (!text) return;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ocrvision_extracted_text.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('File downloaded!', 'success');
});

// ─── Clear Output Text ────────────────────────
clearTextBtn.addEventListener('click', () => {
  outputText.style.display = 'none';
  outputText.value = '';
  outputPlaceholder.style.display = 'flex';
  outputFooter.style.display = 'none';
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  clearTextBtn.disabled = true;
});

// ─── Toast Notification ───────────────────────
function showToast(message, type = 'success') {
  if (toastTimeout) clearTimeout(toastTimeout);

  toastMessage.textContent = message;
  toast.style.background = type === 'error'
    ? 'rgba(239, 68, 68, 0.15)'
    : 'rgba(16, 185, 129, 0.15)';
  toast.style.borderColor = type === 'error'
    ? 'rgba(239, 68, 68, 0.3)'
    : 'rgba(16, 185, 129, 0.3)';
  toast.style.color = type === 'error' ? '#f87171' : '#34d399';

  // Update icon
  toast.querySelector('svg path').setAttribute(
    'd',
    type === 'error'
      ? 'M6 18L18 6M6 6l12 12'
      : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  );

  toast.classList.add('show');
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── Smooth hero CTA scroll ───────────────────
document.getElementById('heroCtaBtn').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('converter').scrollIntoView({ behavior: 'smooth' });
});
