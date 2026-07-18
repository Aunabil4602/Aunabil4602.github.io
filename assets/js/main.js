const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".nav-links");

if (menuButton && navigation) {
  const closeMenu = () => {
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  navigation.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 800) closeMenu();
  });
}

const newsContainer = document.querySelector("[data-news-source]");

if (newsContainer) {
  fetch(newsContainer.dataset.newsSource)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load news (${response.status})`);
      return response.text();
    })
    .then((html) => {
      const newsDocument = new DOMParser().parseFromString(html, "text/html");
      const newsList = newsDocument.querySelector(".all-news .news-list");

      if (!newsList) throw new Error("No news list found");
      newsContainer.replaceChildren(newsList.cloneNode(true));
    })
    .catch(() => {
      const message = document.createElement("p");
      const link = document.createElement("a");
      link.href = newsContainer.dataset.newsSource;
      link.textContent = "View all news";
      message.append("News could not be loaded here. ", link, ".");
      newsContainer.replaceChildren(message);
    });
}

const pdfViewer = document.querySelector("[data-pdf-viewer]");

if (pdfViewer) {
  const pdfPages = pdfViewer.querySelector("[data-pdf-pages]");
  const status = pdfViewer.querySelector(".pdf-status");
  const zoomOut = document.querySelector("#cv-zoom-out");
  const zoomIn = document.querySelector("#cv-zoom-in");
  const zoomLevel = document.querySelector("#cv-zoom-level");
  const pdfjs = window.pdfjsLib;
  let pdfDocument;
  let scale = 1.35;
  let renderVersion = 0;

  const showStatus = (message) => {
    status.textContent = message;
    status.hidden = false;
    if (!status.isConnected) pdfPages.prepend(status);
  };

  const showError = () => {
    showStatus("The CV could not be displayed. Please use the Download CV button.");
  };

  const renderPdf = async () => {
    const currentVersion = ++renderVersion;
    const canvases = [];
    showStatus("Rendering CV…");

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      if (currentVersion !== renderVersion) return;

      const viewport = page.getViewport({ scale });
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.className = "pdf-page";
      canvas.setAttribute("aria-label", `CV page ${pageNumber} of ${pdfDocument.numPages}`);
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      await page.render({
        canvasContext: context,
        viewport,
        transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
      }).promise;

      if (currentVersion !== renderVersion) return;
      canvases.push(canvas);
    }

    pdfPages.replaceChildren(status, ...canvases);
    status.hidden = true;
    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    pdfViewer.scrollTo({ top: 0, left: 0 });
  };

  if (!pdfjs) {
    showError();
  } else {
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    pdfjs
      .getDocument(pdfViewer.dataset.pdfSource)
      .promise.then((document) => {
        pdfDocument = document;
        return renderPdf();
      })
      .catch(showError);

    zoomOut.addEventListener("click", () => {
      if (!pdfDocument || scale <= 0.75) return;
      scale = Math.max(0.75, scale - 0.15);
      renderPdf();
    });

    zoomIn.addEventListener("click", () => {
      if (!pdfDocument || scale >= 2.25) return;
      scale = Math.min(2.25, scale + 0.15);
      renderPdf();
    });
  }
}
