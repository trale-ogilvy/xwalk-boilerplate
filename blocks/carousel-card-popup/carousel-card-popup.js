import { moveInstrumentation } from "../../scripts/scripts.js";
import { fetchPlaceholders, normalToKebab } from "../../scripts/utils.js";
import { categoriesMap } from "../programs-listings/programs-listings-constants.js";

let modalElements = null;

async function createPopupModal() {
  // Fetch placeholders
  const placeholders = await fetchPlaceholders();
  const closeText = placeholders?.globalClose || "CLOSE";

  const modal = document.createElement("div");
  modal.className = "ccp-modal block";

  const overlay = document.createElement("div");
  overlay.className = "ccp-overlay";

  const cardContainer = document.createElement("div");
  cardContainer.className = "ccp-container";

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "ccp-content";

  const closeBtn = document.createElement("button");
  closeBtn.className = "ccp-close-btn";
  closeBtn.setAttribute("aria-label", "Close");

  const closeIcon = document.createElement("span");
  closeIcon.className = "ccp-close-icon";

  const closeTextSpan = document.createElement("span");
  closeTextSpan.className = "ccp-close-text text-b";
  closeTextSpan.textContent = closeText;

  closeBtn.appendChild(closeIcon);
  closeBtn.appendChild(closeTextSpan);

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "ccp-image";

  const textContentWrapper = document.createElement("div");
  textContentWrapper.className = "ccp-text";

  const titleEl = document.createElement("h3");
  titleEl.className = "ccp-title text-h4";

  const descriptionEl = document.createElement("div");
  descriptionEl.className = "ccp-description text-p2";

  const detailsWrapper = document.createElement("div");
  detailsWrapper.className = "ccp-details-wrapper";

  // Commented out label tag element
  // const labelTagEl = document.createElement("p");
  // labelTagEl.className = "ccp-label-tag text-l2";

  // Commented out secondary title element
  // const popupTitleEl = document.createElement("p");
  // popupTitleEl.className = "ccp-secondary-title text-h5";

  const detailsList = document.createElement("div");
  detailsList.className = "ccp-details-list";

  const dateRangeEl = document.createElement("div");
  dateRangeEl.className = "ccp-detail-item text-p2";

  const timeRangeEl = document.createElement("div");
  timeRangeEl.className = "ccp-detail-item text-p2";

  const locationEl = document.createElement("div");
  locationEl.className = "ccp-detail-item text-p2";

  detailsList.append(dateRangeEl, timeRangeEl, locationEl);

  const ctaContainer = document.createElement("div");
  ctaContainer.className = "ccp-cta-container text-b";

  // Updated to exclude commented elements
  detailsWrapper.append(
    /* labelTagEl, popupTitleEl, */ detailsList,
    ctaContainer
  );
  textContentWrapper.append(titleEl, descriptionEl, detailsWrapper);
  contentWrapper.append(imageWrapper, textContentWrapper);
  cardContainer.append(closeBtn, contentWrapper);
  modal.append(overlay, cardContainer);
  document.body.append(modal);

  return {
    modal,
    overlay,
    closeBtn,
    closeTextSpan,
    imageWrapper,
    titleEl,
    descriptionEl,
    // labelTagEl, // Commented out
    // popupTitleEl, // Commented out
    dateRangeEl,
    timeRangeEl,
    locationEl,
    ctaContainer,
  };
}

function closeModal() {
  if (modalElements) {
    modalElements.modal.classList.remove("active");
  }
}

export async function handleProfileCardTrigger(e, options = {}, site) {
  if (e) e.preventDefault();

  if (!modalElements) {
    modalElements = await createPopupModal();
    modalElements.closeBtn.onclick = closeModal;
    modalElements.overlay.onclick = closeModal;
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        modalElements.modal.classList.contains("active")
      ) {
        closeModal();
      }
    });
  }

  const { cardData } = options;
  if (cardData) {
    modalElements.titleEl.textContent = cardData.title || "";

    modalElements.descriptionEl.innerHTML =
      cardData.dedicatedDescription || cardData.description || "";
    modalElements.imageWrapper.innerHTML = cardData.image
      ? `<img src="${cardData.image}" alt="${cardData.title || "Profile"}"/>`
      : "";

    // Commented out label tag population
    // modalElements.labelTagEl.textContent =
    //   categoriesMap.events[site?.toLowerCase()]?.categories[
    //     normalToKebab(cardData.labelTag)
    //   ] ||
    //   cardData.labelTag ||
    //   cardData.labelTag ||
    //   "";

    // Commented out secondary title population
    // modalElements.popupTitleEl.textContent = cardData.popupTitle || "";

    modalElements.dateRangeEl.innerHTML = cardData.dateRange
      ? `<span class="icon-calendar"></span><span>${cardData.dateRange}</span>`
      : "";
    modalElements.timeRangeEl.innerHTML = cardData.timeRange
      ? `<span class="icon-clock"></span><span>${cardData.timeRange}</span>`
      : "";
    modalElements.locationEl.innerHTML = cardData.location
      ? `<span class="icon-location"></span><span>${cardData.location}</span>`
      : "";

    // handle CTA
    if (cardData.ctaText) {
      if (cardData.ctaLink) {
        modalElements.ctaContainer.innerHTML = `
          <a href="${cardData.ctaLink}" class="ccp-cta-link" target="_blank" rel="noopener noreferrer">
            <span>${cardData.ctaText}</span>
            <span class="ccp-cta-icon"></span>
          </a>
        `;
      } else {
        modalElements.ctaContainer.innerHTML = `
          <span class="ccp-cta-text">${cardData.ctaText}</span>
        `;
      }
    } else {
      modalElements.ctaContainer.innerHTML = "";
    }

    if (cardData.source) {
      moveInstrumentation(cardData.source.title, modalElements.titleEl);

      const descriptionSourceElement =
        cardData.source.dedicatedDescription &&
        cardData.source.dedicatedDescription.innerHTML.trim()
          ? cardData.source.dedicatedDescription
          : cardData.source.description;
      moveInstrumentation(
        descriptionSourceElement,
        modalElements.descriptionEl
      );
      moveInstrumentation(cardData.source.image, modalElements.imageWrapper);

      // Commented out instrumentation for removed elements
      // moveInstrumentation(cardData.source.labelTag, modalElements.labelTagEl);
      // moveInstrumentation(cardData.source.popupTitle, modalElements.popupTitleEl);

      moveInstrumentation(cardData.source.dateRange, modalElements.dateRangeEl);
      moveInstrumentation(cardData.source.timeRange, modalElements.timeRangeEl);
      moveInstrumentation(cardData.source.location, modalElements.locationEl);
    }
  }

  modalElements.modal.offsetHeight;

  modalElements.modal.classList.add("active");
}

export default function decorate(block) {
  block.style.display = "none";
}
