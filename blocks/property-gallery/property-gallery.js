import {
  processCard,
  handleCardClick,
  handleAuthoringEnvironment,
} from "./property-gallery-utils.js";
import {
  createMobileCategoryFilter,
  disableScroll,
  fetchPlaceholders,
} from "../../scripts/utils.js";
import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import {
  applyNewsTickerAnimation,
  killNewsTickerAnimation,
  pauseNewsTickerAnimation,
} from "../../scripts/utils.js";

let currentCategory = "";
let isMobile = window.innerWidth <= 767;
let lastIsMobile = isMobile;
let restoreScroll;

export default async function decorate(block) {
  if (isUniversalEditor()) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/property-gallery/property-gallery-author.css`
    );
    handleAuthoringEnvironment(block);
    return;
  }

  const placeholders = await fetchPlaceholders();
  const closeText = placeholders?.globalClose || "CLOSE";

  const categories = block.children[0]
    .querySelector("p")
    .innerText.split(",")
    .map((cat) => cat.trim());

  // Initial Category
  currentCategory = categories[0];
  const cards = [];

  const cardsDiv = [...block.children].slice(1);
  cardsDiv.forEach((card) => {
    const cardContent = processCard(card);
    cards.push(cardContent);
  });
  let filteredCards = cards.filter((card) => card.category === currentCategory);

  block.innerHTML = `
  <div class="header">
    <button class="cta-link close-icon icon-left" aria-label="Close Gallery"><span class="animate-underline">${closeText}</span></button>
    <div class="logo"><img src="/icons/patina-green-flower.svg" alt="Patina Flower"></div>
  </div>

  <div class="category-filters">
    ${categories
      .map(
        (cat) => `
      <button class="filter-button cta-link  ${
        cat === currentCategory ? "active" : "inactive animate-underline"
      }" data-category="${cat}">${cat}</button>
    `
      )
      .join("")}
  </div>

  <div class="card-container">
  <ul class="cards">
    ${filteredCards
      .map(
        (card) => `
      <li class="card">
        ${card.img.outerHTML}
        <div class="label text-p2 text-text-white">${card.label}</div>
      </li>
    `
      )
      .join("")}
  </ul>
</div>
`;

  /* ------------------------- Mobile Category Filter ------------------------- */
  const mobileFilter = createMobileCategoryFilter(
    categories.map((cat) => ({ label: cat, value: cat })),
    currentCategory,
    (selected) => {
      if (currentCategory !== selected) {
        currentCategory = selected;
        const categoryFiltersDiv = block.querySelector(".category-filters");
        categoryFiltersDiv.innerHTML = categories
          .map(
            (cat) => `
          <button class="filter-button cta-link ${
            cat === currentCategory ? "active" : "inactive animate-underline"
          }" data-category="${cat}">${cat}</button>
        `
          )
          .join("");
        setupCategoryFilters(block, cards);
      }

      // Filter cards
      filteredCards = cards.filter((card) => card.category === currentCategory);
      const cardsContainer = block.querySelector(".cards");
      // Fade out
      cardsContainer.style.transition = "opacity 0.3s";
      cardsContainer.style.opacity = "0";
      setTimeout(() => {
        cardsContainer.innerHTML = filteredCards
          .map(
            (card) => `
              <li class="card">
                ${card.img.outerHTML}
                <div class="label text-p2 text-text-white">${card.label}</div>
              </li>
            `
          )
          .join("");
        // Fade in
        cardsContainer.style.opacity = "1";
        handleCardClick(block, filteredCards, placeholders);

        // Scroll to top after cards rendered
        const cardContainer = block.querySelector(".card-container");
        if (cardContainer) cardContainer.scrollTop = 0;
      }, 300);
    }
  );
  block.appendChild(mobileFilter);
  // Add click event to close button to set opacity 0
  const closeBtn = block.querySelector(".close-icon");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const mobileCategoryFilter = block.querySelector(
        ".mobile-category-filter"
      );
      if (mobileCategoryFilter) {
        mobileCategoryFilter.style.pointerEvents = "none";
      }
      pauseNewsTickerAnimation("property-gallery");
      block.style.transition = "opacity 0.5s";
      block.style.opacity = "0";
      block.style.pointerEvents = "none";
      if (typeof restoreScroll === "function") restoreScroll();
    });
  }

  document.body.appendChild(block);

  setupCategoryFilters(block, cards);
  handleCardClick(block, filteredCards, placeholders);
  setTimeout(() => {
    handleOpenModal();
    handleMobileScroll(block);
  }, 0);

  /* -------------------------- Resize Event Listener ------------------------- */
  window.addEventListener("resize", () => {
    const nowIsMobile = window.innerWidth <= 767;
    if (nowIsMobile !== lastIsMobile) {
      lastIsMobile = nowIsMobile;
      isMobile = nowIsMobile;
      if (isMobile) {
        if (typeof killNewsTickerAnimation === "function") {
          pauseNewsTickerAnimation("property-gallery");
          killNewsTickerAnimation("property-gallery");
        }
        const cardEls = block.querySelectorAll(".card");
        cardEls.forEach((el) => {
          el.style.transform = "";
        });
      } else {
        if (typeof applyNewsTickerAnimation === "function") {
          applyNewsTickerAnimation("property-gallery");
        }
      }
    }
  });
}

function setupCategoryFilters(block, cards) {
  const filters = block.querySelectorAll(".filter-button");
  filters.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const selectedCategory = btn.dataset.category;
      if (selectedCategory === currentCategory) return;
      currentCategory = selectedCategory;

      // Re-render category filters to update active button
      const categories = Array.from(filters).map((b) => b.dataset.category);
      const categoryFiltersDiv = block.querySelector(".category-filters");
      categoryFiltersDiv.innerHTML = categories
        .map(
          (cat) => `
      <button class="filter-button cta-link ${
        cat === currentCategory ? "active" : "inactive animate-underline"
      }" data-category="${cat}">${cat}</button>
      `
        )
        .join("");

      // Re-attach event listeners to new buttons
      setupCategoryFilters(block, cards);

      // Filter cards
      const filteredCards = cards.filter(
        (card) => card.category === currentCategory
      );
      const cardsContainer = block.querySelector(".cards");

      // Fade out left
      cardsContainer.style.transition = "transform 0.3s, opacity 0.3s";
      cardsContainer.style.transform = "translateX(-40px)";
      cardsContainer.style.opacity = "0";

      setTimeout(() => {
        cardsContainer.innerHTML = filteredCards
          .map(
            (card) => `
          <li class="card">
          ${card.img.outerHTML}
          <div class="label text-p2 text-text-white">${card.label}</div>
          </li>
        `
          )
          .join("");
        // Reset transform for fade in left
        cardsContainer.style.transition = "none";
        cardsContainer.style.transform = "translateX(-40px)";
        cardsContainer.style.opacity = "0";
        // Force reflow
        cardsContainer.offsetWidth;
        // Fade in left
        cardsContainer.style.transition = "transform 0.3s, opacity 0.3s";
        cardsContainer.style.transform = "translateX(0)";
        cardsContainer.style.opacity = "1";
        handleCardClick(block, filteredCards);
        if (!isMobile)
          setTimeout(() => applyNewsTickerAnimation("property-gallery"), 0);
      }, 300);
    });
  });
}

function handleOpenModal() {
  document.body.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (link) {
      const href = link.getAttribute("href");
      let path;
      try {
        const url = new URL(href, window.location.origin);
        path = url.pathname;
      } catch (e) {
        path = href.split("?")[0].split("#")[0];
      }

      const normalizedPath = path.replace(/^\/|\/$/g, "");
      if (normalizedPath === "imageGallery") {
        e.preventDefault();
        e.stopPropagation();
        const galleryBlock = document.querySelector(".property-gallery.block");
        const mobileCategoryFilter = galleryBlock.querySelector(
          ".mobile-category-filter"
        );
        if (mobileCategoryFilter) {
          mobileCategoryFilter.style.pointerEvents = "auto";
        }
        if (galleryBlock) {
          galleryBlock.style.transition = "opacity 0.5s";
          galleryBlock.style.opacity = "0";
          // Force reflow to ensure transition applies
          galleryBlock.offsetWidth;
          galleryBlock.style.opacity = "1";
          galleryBlock.style.pointerEvents = "auto";
          if (!isMobile)
            setTimeout(() => applyNewsTickerAnimation("property-gallery"), 0);
        }
        if (typeof disableScroll === "function") {
          restoreScroll = disableScroll();
        }
      }
    }
  });
}

function handleMobileScroll(block) {
  if (!isMobile) return;
  const cardContainer = block.querySelector(".card-container");
  if (!cardContainer) return;
  let lastScrollTop = cardContainer.scrollTop;
  const header = block.querySelector(".header");

  cardContainer.addEventListener("scroll", () => {
    const currentScrollTop = cardContainer.scrollTop;
    if (currentScrollTop === 0) {
      header.classList.remove("hide");
    } else if (currentScrollTop > lastScrollTop) {
      header.classList.add("hide");
    } else {
      header.classList.remove("hide");
    }
    lastScrollTop = currentScrollTop;
  });
}
