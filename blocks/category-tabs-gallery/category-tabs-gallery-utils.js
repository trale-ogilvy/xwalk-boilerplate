import {
  handleEditorEnvCarouselModals,
  handleMediaBlocks,
  handleAuthoringContentChange,
} from "../../scripts/utils.js";

/**
 * Fade in an element
 * @param {HTMLElement} el
 */
export function fadeIn(el) {
  el.style.opacity = 0;
  el.style.display = "";
  el.style.transition = "opacity 0.6s";
  requestAnimationFrame(() => {
    el.style.opacity = 1;
  });
}

/**
 * Fade out an element, then call callback
 * @param {HTMLElement} el
 * @param {Function} cb
 */
export function fadeOut(el, cb) {
  el.style.opacity = 1;
  el.style.transition = "opacity 0.6s";
  requestAnimationFrame(() => {
    el.style.opacity = 0;
    setTimeout(() => {
      el.style.display = "none";
      if (cb) cb();
    }, 600);
  });
}

export function handleEditorEnv() {
  const cardContainerExist = document.querySelector(".cards-container");

  const cardItems = document.querySelectorAll(".category-tabs-gallery.block");
  const imprintsContainer = document.querySelector(
    ".category-tabs-gallery-container"
  );
  const imprintsWrapper = document.querySelectorAll(
    ".category-tabs-gallery-wrapper"
  );

  if (!cardContainerExist) {
    const cardsContainer = document.createElement("section");
    cardsContainer.classList.add("cards-container");
    imprintsContainer.appendChild(cardsContainer);
    imprintsWrapper.forEach((wrapper) => cardsContainer.appendChild(wrapper));
  }
  cardItems.forEach((card) => {
    const mainSection = document.createElement("section");
    mainSection.classList.add("main-section");

    // Media
    const media = card.children[1].children[0];
    const mediaDiv = document.createElement("div");
    mediaDiv.classList.add("media");
    if (media) {
      handleMediaBlocks([media], [], mediaDiv);
    }
    mainSection.appendChild(mediaDiv);

    // Content
    const mainContentRows = [...card.children].slice(0, 7);
    const cardContent = document.createElement("div");
    cardContent.classList.add("card-content");
    cardContent.append(...mainContentRows);
    mainSection.appendChild(cardContent);

    card.appendChild(mainSection);

    // Modals
    const modalsContent = [...card.children].slice(0, -1);
    const modalSection = handleEditorEnvCarouselModals(modalsContent);
    card.appendChild(modalSection);

    // Check CTA
    const cta = mainContentRows[4]?.children[0].children[1]?.children[0] || "";
    if (cta) {
      // Remove modal
      const modals = card.querySelector(".carousel-modal-section");
      modals?.remove();
    }
  });
}

/* --------------- Listen for changes in authoring environment -------------- */
handleAuthoringContentChange(".card-content", handleEditorEnv);
