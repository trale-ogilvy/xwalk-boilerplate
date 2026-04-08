import { moveInstrumentation } from "../../scripts/scripts.js";

let scrollY = 0;
let isScrollLocked = false;

function disableBodyScroll(lock) {
  if (lock && !isScrollLocked) {
    scrollY = window.scrollY;
    isScrollLocked = true;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  } else if (!lock && isScrollLocked) {
    isScrollLocked = false;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, scrollY);
  }
}

let modalElement = null;

function createPopupModal() {
  const modal = document.createElement("div");
  modal.className = "floorplan-popup-modal";

  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  const cardContainer = document.createElement("div");
  cardContainer.className = "floorplan-popup-container";

  const closeBtn = document.createElement("button");
  closeBtn.className = "popup-close-btn close-icon icon-left";

  const iframeWrapper = document.createElement("div");
  iframeWrapper.className = "floorplan-popup-iframe-wrapper";

  const iframe = document.createElement("iframe");
  iframe.className = "floorplan-popup-iframe";
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute("title", "Floorplan Viewer");

  iframeWrapper.append(iframe);
  cardContainer.append(closeBtn, iframeWrapper);
  modal.append(overlay, cardContainer);
  document.body.append(modal);

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("active")) {
      closeModal();
    }
  });

  return modal;
}

function closeModal() {
  if (modalElement) {
    modalElement.classList.remove("active");

    const iframe = modalElement.querySelector("iframe");
    if (iframe) {
      iframe.src = "about:blank";
    }
    disableBodyScroll(false);
  }
}

function openPopup() {
  const sourceBlock = document.querySelector(".floor-plan-popup.block");
  if (!sourceBlock) {
    console.warn("Floorplan popup source block not found on page.");
    return;
  }

  const link = sourceBlock.querySelector("a");
  const iframe = modalElement.querySelector(".floorplan-popup-iframe");

  if (link && iframe) {
    iframe.src = link.href;
    moveInstrumentation(link.parentElement, iframe.parentElement);
  } else {
    console.warn("Floorplan popup: No link found in the source block.");
  }

  modalElement.classList.add("active");
  disableBodyScroll(true);
}

export default function decorate(block) {
  const section = block.closest(".section");
  if (section) {
    section.style.display = "none";
  }
}

if (document.body.querySelector('a[href="/floorplanPopup"]')) {
  if (!modalElement) {
    modalElement = createPopupModal();
  }
}

document.body.addEventListener("click", (e) => {
  const link = e.target.closest('a[href="/floorplanPopup"]');

  if (link) {
    e.preventDefault();
    e.stopPropagation();
    openPopup();
  }
});
