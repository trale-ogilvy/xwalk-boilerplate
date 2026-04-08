import {
  handleMediaBlocks,
  loadSwiper,
  handleAuthoringContentChange,
  handleEditorEnvCarouselModals,
} from "../../scripts/utils.js";
import {
  createCarouselModal,
  parseModalSlide,
} from "../../scripts/carousel-modal-utils.js";
import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";

async function imprintsTeaser() {
  await loadSwiper();

  const mainContainer = document.querySelector(
    ".imprints-teaser-cards-container"
  );
  const cardItems = document.querySelectorAll(".imprints-teaser-card-wrapper");

  const filteredModals = [];
  const modals = [];
  let firstItemData = null; // Store first item data for last item's "up next"

  cardItems.forEach((card, idx) => {
    const rows = [...card.children[0].children];
    const mainContentRows = rows.slice(0, 5);
    const slideRows = rows.slice(5);

    const mediaElements = mainContentRows[0].children[0];
    const mainMediaContainer = document.createElement("div");
    mainMediaContainer.classList.add("main-media-container");

    const paragraphs = mainContentRows[1]?.children?.[0].children;
    const label = paragraphs?.[0]?.textContent || "";
    const title = paragraphs?.[1]?.textContent || "";
    const ctaTextEl = mainContentRows[2]?.children?.[0].children;
    const isLink = ctaTextEl?.[1] !== undefined && ctaTextEl?.[1] !== null;
    let previewImage = "";

    if (mainContentRows[4].querySelector("picture")) {
      previewImage = mainContentRows[4].children[0];
    }

    handleMediaBlocks(
      [mediaElements],
      [],
      mainMediaContainer,
      true,
      previewImage
    );

    card.dataset.modalIdx = `${filteredModals.length}`;
    card.innerHTML = `
      <div class="imprints-card-media-wrapper">
        ${mainMediaContainer.innerHTML}
      </div>
      <div class="imprints-card-content-wrapper">
        <p class="imprints-card-label text-text-white text-l2">${label}</p>
        <h2 class="imprints-card-title text-text-white text-h2">${title}</h2>
       ${
         isLink
           ? `<a href="${ctaTextEl?.[1]?.textContent.trim()}" class="imprints-card-cta text-text-white cta-link animate-underline">${
               ctaTextEl[0].textContent.trim() || "Discover"
             }</a>`
           : `<p class="imprints-card-cta text-text-white cta-link animate-underline">${
               ctaTextEl?.[0]?.textContent.trim() || "Discover"
             } </p>`
       }
      </div>
  `;

    // Mute any video elements
    const videoElements = card.querySelectorAll("video");
    videoElements.forEach((video) => {
      video.muted = true;
    }); // Create modal if there are slides
    // Prepare Up Next modal logic
    let isLastItem = false;
    let modal = null;

    // Determine if CTA is a link
    const itemCtaLink = isLink ? ctaTextEl[1].textContent.trim() : null;

    // Save first item data for last item's "up next" (only for items that can have modals)
    if (idx === 0 && !itemCtaLink && slideRows.length > 0) {
      firstItemData = {
        itemUpNextText: mainContentRows[3]?.textContent.trim() || "",
        itemImage: slideRows[0]?.querySelector("picture")?.outerHTML || "",
      };
    }

    const openNextModal = () => {
      // Find the next modal in the filteredModals array
      const currentModalIndex = filteredModals.findIndex(
        (modal) => modal.element.id === `modal-${idx}`
      );
      const nextModalIndex = (currentModalIndex + 1) % filteredModals.length;

      if (filteredModals[nextModalIndex]) {
        filteredModals[nextModalIndex].open();
      }
    };

    /* ------------------------------ Handle Modal ------------------------------ */
    if (!itemCtaLink) {
      // Check if this is the last item that can have a modal
      const isLastModalItem = (() => {
        // Find all items that can have modals (no itemCtaLink)
        const modalItems = [];
        cardItems.forEach((checkCard, checkIdx) => {
          const checkRows = [...checkCard.children[0].children];
          const checkMainContentRows = checkRows.slice(0, 5);
          const checkCtaTextEl =
            checkMainContentRows[2]?.children?.[0].children;
          const checkIsLink =
            checkCtaTextEl?.[1] !== undefined && checkCtaTextEl?.[1] !== null;
          const checkItemCtaLink = checkIsLink
            ? checkCtaTextEl[1].textContent.trim()
            : null;

          if (!checkItemCtaLink) {
            modalItems.push(checkIdx);
          }
        });

        // Check if current item is the last modal item
        return (
          modalItems.length > 0 && idx === modalItems[modalItems.length - 1]
        );
      })();

      let nextItemData = {};

      if (isLastModalItem && firstItemData) {
        // Use hardcoded first item data for last item
        nextItemData = firstItemData;
      } else {
        // Find the next item that also has a modal (no itemCtaLink)
        let foundNextItem = false;
        for (let i = 1; i < cardItems.length; i++) {
          const nextIdx = (idx + i) % cardItems.length; // Wrap around to beginning if needed
          const nextItem = cardItems[nextIdx];

          if (nextItem) {
            const nextRows = [...nextItem.children[0].children];
            const nextMainContentRows = nextRows.slice(0, 5);
            const nextSlideRows = nextRows.slice(5);
            const nextItemCtaLink =
              nextMainContentRows[2]?.children?.[0].children[1] || "";
            const itemUpNextText =
              nextMainContentRows[3]?.textContent.trim() || "";

            if (!nextItemCtaLink) {
              nextItemData = {
                itemUpNextText,
                itemImage:
                  nextSlideRows[0]?.querySelector("picture")?.outerHTML || "",
              };
              foundNextItem = true;
              break;
            }
          }
        }

        // If no next modal item found, use empty data
        if (!foundNextItem) {
          nextItemData = {
            itemUpNextText: "",
            itemImage: "",
          };
        }
      }

      modal = createCarouselModal(
        mainContainer,
        `modal-${idx}`,
        slideRows,
        parseModalSlide,
        openNextModal,
        isLastItem,
        nextItemData
      );

      modals[idx] = modal;
      filteredModals.push(modal);
    }
  });

  // Re-attach modal open events after re-render
  const cardWrapper = document.querySelectorAll(
    ".imprints-teaser-card-wrapper"
  );
  cardWrapper.forEach((item) => {
    const button = item.querySelector(".imprints-card-cta");
    const modalIdx = Number(item.dataset.modalIdx);
    button.addEventListener("click", (e) => {
      if (button.tagName === "A") return;
      e.stopPropagation();
      if (filteredModals[modalIdx]) {
        filteredModals[modalIdx].open();
      }
    });
  });
}

/* --------------------------- Handle button click -------------------------- */

function parallax() {
  const mainSection = document.querySelector(".imprints-teaser-card-container");

  const cardsContainer = document.createElement("section");
  cardsContainer.classList.add("imprints-teaser-cards-container");

  const stickyContainer = document.createElement("div");
  stickyContainer.classList.add("imprints-teaser-cards-sticky-container");

  const cards = document.querySelectorAll(".imprints-teaser-card-wrapper");
  const container = document.querySelector(".imprints-teaser-card-container");

  const imprintTitle = mainSection.querySelector(".default-content-wrapper");
  if (imprintTitle) {
    stickyContainer.appendChild(imprintTitle);
  }

  cardsContainer.style.height = `${100 * cards.length}vh`;

  cards.forEach((card, idx) => {
    stickyContainer.appendChild(card);

    card.style.zIndex = cards.length - idx;
    // Remove the translateY transform that might interfere with CSS positioning
    card.style.marginTop = `${idx * 32}px`;

    // Scale cards down based on index - higher index = smaller card
    const scale = 1 - idx * 0.04; // Each card is 10% smaller than the previous
    card.style.transform = `translate(-50%, -50%) scale(${scale})`;
    // Scale up the content wrapper to counteract the card scale
    setTimeout(() => {
      const contentWrapper = card.querySelector(
        ".imprints-card-content-wrapper"
      );
      if (contentWrapper) {
        contentWrapper.style.transform = `translate(-50%, 0) scale(${
          1 + idx * 0.04
        })`;
      }
    }, 0);
  });

  cards.forEach((card, idx) => {
    // Animate card upwards as you scroll using GSAP
    if (window.gsap && window.ScrollTrigger) {
      const delay =
        localStorage.getItem("flowerSplashPlayed") === "true" ? 1000 : 5000;
      setTimeout(() => {
        gsap.registerPlugin(ScrollTrigger);
        // Only animate if not the last card
        if (idx < cards.length - 1) {
          gsap.to(card, {
            y: "-100vh",
            scrollTrigger: {
              trigger: cardsContainer,
              // Calculate pixel values for start and end based on viewport height
              start: `top+=${(idx * 100 * window.innerHeight) / 100} top`,
              end: `top+=${((idx + 1) * 100 * window.innerHeight) / 100} top`,
              scrub: true,
            },
          });
        }
      }, delay);
    }
  });
  cardsContainer.appendChild(stickyContainer);
  container.appendChild(cardsContainer);
}

function alignLogoToCard() {
  const isMobile = window.innerWidth < 767;

  const stickyContainer = document.querySelector(
    ".imprints-teaser-cards-sticky-container"
  );
  const card = stickyContainer?.querySelector(".imprints-teaser-card-wrapper");
  const logo = stickyContainer?.querySelector(".default-content-wrapper");
  if (card && logo && stickyContainer) {
    // Get card's top relative to sticky container
    const cardRect = card.getBoundingClientRect();
    const stickyRect = stickyContainer.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();
    // Calculate offset so logo's bottom touches card's top
    const offset = cardRect.top - stickyRect.top - logoRect.height;
    const moreOffset = isMobile ? 17 : 14;
    logo.style.top = `${offset + moreOffset}px`;
  }
}
let lastWidth = window.innerWidth;
window.addEventListener("resize", () => {
  if (window.innerWidth !== lastWidth) {
    lastWidth = window.innerWidth;
    alignLogoToCard();
  }
});
setTimeout(alignLogoToCard, 100);

if (isUniversalEditor()) {
  loadCSS(
    `${window.hlx.codeBasePath}/blocks/imprints-teaser-card/imprints-teaser-card-author.css`
  );
  handleEditorEnv();
} else {
  parallax();
  imprintsTeaser();
}

function handleEditorEnv() {
  const cardContainerExist = document.querySelector(".cards-container");

  const cardItems = document.querySelectorAll(".imprints-teaser-card.block");
  const imprintsContainer = document.querySelector(
    ".imprints-teaser-card-container"
  );
  const imprintsWrapper = document.querySelectorAll(
    ".imprints-teaser-card-wrapper"
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
    const media = card.children[0].children[0];
    const mediaDiv = document.createElement("div");
    mediaDiv.classList.add("media");
    handleMediaBlocks([media], [], mediaDiv, true);
    mainSection.appendChild(mediaDiv);

    // Content
    const mainContentRows = [...card.children].slice(1, 3);
    const cardContent = document.createElement("div");
    cardContent.classList.add("card-content");
    cardContent.append(...mainContentRows);
    mainSection.appendChild(cardContent);

    card.appendChild(mainSection);

    // Modals
    const modalsContent = [...card.children].slice(3, -1);
    const modalSection = handleEditorEnvCarouselModals(modalsContent);
    card.appendChild(modalSection);

    // Check CTA
    const cta = mainContentRows[1].children[0]?.children?.[1];
    if (cta) {
      // Remove modal
      const modals = card.querySelector(".carousel-modal-section");
      modals?.remove();
    }
  });
}

/* --------------- Listen for changes in authoring environment -------------- */
handleAuthoringContentChange(
  ".imprints-teaser-card-container",
  handleEditorEnv
);
