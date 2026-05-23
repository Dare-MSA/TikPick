const urlInput = document.getElementById("url-input");
const btnPaste = document.getElementById("btn-paste");
const btnFetch = document.getElementById("btn-fetch");
const errorMsg = document.getElementById("error-msg");
const loader = document.getElementById("loader");
const inputSection = document.getElementById("input-section");
const resultSection = document.getElementById("result-section");
const resultThumb = document.getElementById("result-thumb");
const resultTitle = document.getElementById("result-title");
const resultAuthor = document.getElementById("result-author");
const btnDownload = document.getElementById("btn-download");
const btnReset = document.getElementById("btn-reset");
const features = document.getElementById("features");
const progressBar = document.getElementById("progress-bar");
const loaderTips = document.getElementById("loader-tips");

let currentUrl = "";
let tipsInterval = null;
let progressInterval = null;

const tips = [
  "💡 Tip: You can download unlimited videos for free!",
  "⚡ Fun fact: TikPick processes thousands of videos daily.",
  "🎯 Almost there… preparing your download.",
  "🔒 Your downloads are private and secure.",
  "🌍 TikPick works with TikTok links worldwide.",
  "✨ No watermark, no hassle — just clean videos.",
  "🚀 Hang tight! Great things take a few seconds.",
  "📱 Works on desktop, tablet, and mobile!",
];

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = false;
}

function hideError() {
  errorMsg.hidden = true;
}

function startLoaderAnimations() {
  // Rotating tips
  let tipIndex = 0;
  loaderTips.textContent = tips[tipIndex];
  tipsInterval = setInterval(() => {
    tipIndex = (tipIndex + 1) % tips.length;
    loaderTips.style.opacity = "0";
    setTimeout(() => {
      loaderTips.textContent = tips[tipIndex];
      loaderTips.style.opacity = "1";
    }, 300);
  }, 2500);

  // Fake progress bar
  let progress = 0;
  progressBar.style.width = "0%";
  progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += Math.random() * 8 + 2;
      if (progress > 90) progress = 90;
      progressBar.style.width = progress + "%";
    }
  }, 500);
}

function stopLoaderAnimations() {
  // Complete progress bar
  if (progressBar) {
    progressBar.style.width = "100%";
  }

  clearInterval(tipsInterval);
  clearInterval(progressInterval);
  tipsInterval = null;
  progressInterval = null;
}

function showLoader(show) {
  loader.hidden = !show;
  if (show) {
    startLoaderAnimations();
  } else {
    stopLoaderAnimations();
  }
}

function showResult(data) {
  inputSection.hidden = true;
  features.hidden = true;
  showLoader(false);
  hideError();
  resultThumb.src = data.thumbnail;
  resultThumb.alt = data.title;
  resultThumb.hidden = !data.thumbnail;
  resultTitle.textContent = data.title;
  resultAuthor.textContent = `@${data.author}`;
  resultSection.hidden = false;
}

function resetAll() {
  urlInput.value = "";
  currentUrl = "";
  hideError();
  showLoader(false);
  resultSection.hidden = true;
  inputSection.hidden = false;
  features.hidden = false;
  btnDownload.disabled = false;
  btnDownload.textContent = "📹 Download Video (MP4)";
}

// Paste
btnPaste.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    urlInput.value = text;
    hideError();
  } catch {
    showError("Unable to read clipboard.");
  }
});

// Fetch info
btnFetch.addEventListener("click", async () => {
  hideError();
  const url = urlInput.value.trim();
  if (!url) {
    showError("Please insert a link before downloading.");
    return;
  }

  currentUrl = url;
  btnFetch.disabled = true;
  btnFetch.textContent = "Processing...";
  showLoader(true);

  try {
    const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
    const json = await res.json();

    if (!json.success) {
      showError(json.error || "Failed to fetch video.");
      showLoader(false);
      btnFetch.disabled = false;
      btnFetch.textContent = "Get Download Links";
      return;
    }

    showResult(json.data);
  } catch {
    showError("Server error. Try again.");
    showLoader(false);
  }

  btnFetch.disabled = false;
  btnFetch.textContent = "Get Download Links";
});

// Download MP4
btnDownload.addEventListener("click", () => {
  btnDownload.disabled = true;
  btnDownload.textContent = "Downloading...";

  const link = document.createElement("a");
  link.href = `/api/download?url=${encodeURIComponent(currentUrl)}`;
  link.download = "";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    btnDownload.disabled = false;
    btnDownload.textContent = "📹 Download Video (MP4)";
  }, 5000);
});

// Reset
btnReset.addEventListener("click", resetAll);

// Enter key support
urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnFetch.click();
});

// Scroll animations for cards
const observerOptions = {
  threshold: 0.15,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll(".feature-card, .step-card, .faq-item").forEach((el) => {
  observer.observe(el);
});
