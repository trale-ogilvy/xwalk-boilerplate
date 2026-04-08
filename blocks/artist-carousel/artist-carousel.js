import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import { createMobileCategoryFilter } from "../../scripts/utils.js";
import {
  handleCardClick,
  processCard,
} from "../artist-carousel/artist-carousel-utils.js";
import {
  applyNewsTickerAnimation,
  killNewsTickerAnimation,
  pauseNewsTickerAnimation,
} from "../../scripts/utils.js";

let currentCategory;
let isMobile = window.innerWidth <= 767;
let lastIsMobile = isMobile;
let restoreScroll;

function handleAuthoringEnvironment(block) {
  loadCSS(
    `${window.hlx.codeBasePath}/blocks/artist-carousel/artist-carousel-author.css`
  );
  block.classList.add("ac-authoring-container");

  const allRows = [...block.children];
  block.innerHTML = "";

  const scrollContainer = document.createElement("div");
  scrollContainer.className = "ac-authoring-scroll-container";

  for (const row of allRows) {
    row.classList.add("ac-authoring-card");
    scrollContainer.appendChild(row);
  }

  block.appendChild(scrollContainer);
}

export default async function decorate(block) {
  if (isUniversalEditor()) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/artist-carousel/artist-carousel-author.css`
    );
    handleAuthoringEnvironment(block);
    return;
  }

  const categories = block.children[0]
    .querySelector("p")
    ?.innerText.split(",")
    ?.map((cat) => cat.trim())
    ?.filter((cat) => cat && cat.length > 0); // Remove empty categories

  // Check if categories exist and are not empty
  const hasCategories = categories && categories.length > 0;

  // Initial Category
  currentCategory = hasCategories ? categories[0] : null;
  const cards = [];

  const cardsDiv = [...block.children].slice(1);
  for (const card of cardsDiv) {
    const cardContent = processCard(card);
    cards.push(cardContent);
  }

  // If no categories, show all cards; otherwise filter by current category
  let filteredCards = hasCategories
    ? cards.filter((card) => card.category === currentCategory)
    : cards;
  block.innerHTML = `
  ${
    hasCategories
      ? `
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
  `
      : ""
  }

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
  if (hasCategories) {
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
        filteredCards = cards.filter(
          (card) => card.category === currentCategory
        );
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
          handleCardClick(block, filteredCards);

          // Scroll to top after cards rendered
          const cardContainer = block.querySelector(".card-container");
          if (cardContainer) cardContainer.scrollTop = 0;
        }, 300);
      }
    );
    block.appendChild(mobileFilter);
  }

  // Add click event to close button to set opacity 0
  const closeBtn = block.querySelector(".close-icon");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (hasCategories) {
        const mobileCategoryFilter = block.querySelector(
          ".mobile-category-filter"
        );
        if (mobileCategoryFilter) {
          mobileCategoryFilter.style.pointerEvents = "none";
        }
      }
      pauseNewsTickerAnimation("artist-carousel");
      block.style.transition = "opacity 0.5s";
      block.style.opacity = "0";
      block.style.pointerEvents = "none";
      if (typeof restoreScroll === "function") restoreScroll();
    });
  }

  if (hasCategories) {
    setupCategoryFilters(block, cards);
  }
  handleCardClick(block, filteredCards);

  setTimeout(() => {
    if (isMobile) return;
    if (typeof applyNewsTickerAnimation === "function") {
      applyNewsTickerAnimation("artist-carousel");
    }
  }, 0);

  /* -------------------------- Resize Event Listener ------------------------- */
  window.addEventListener("resize", () => {
    const nowIsMobile = window.innerWidth <= 767;
    if (nowIsMobile !== lastIsMobile) {
      lastIsMobile = nowIsMobile;
      isMobile = nowIsMobile;
      if (isMobile) {
        if (typeof killNewsTickerAnimation === "function") {
          pauseNewsTickerAnimation("artist-carousel");
          killNewsTickerAnimation("artist-carousel");
        }
        const cardEls = block.querySelectorAll(".card");
        for (const el of cardEls) {
          el.style.transform = "";
        };
      } else {
        if (typeof applyNewsTickerAnimation === "function") {
          applyNewsTickerAnimation("artist-carousel");
        }
      }
    }
  });
}

function setupCategoryFilters(block, cards) {
  const filters = block.querySelectorAll(".filter-button");
  for (const btn of filters) {
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
          setTimeout(() => applyNewsTickerAnimation("artist-carousel"), 0);
      }, 300);
    });
  }
}
