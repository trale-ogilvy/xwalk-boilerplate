import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import { loadSwiper, createCategoryTabs } from "../../scripts/utils.js";
import { moveInstrumentation } from "../../scripts/scripts.js";
import { fetchPlaceholders } from "../../scripts/utils.js";

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  const allText = placeholders?.globalAll || "All";

  if (isUniversalEditor()) {
    handleAuthoringEnvironment(block, allText);
  } else {
    try {
      await loadSwiper();
      handleLiveEnvironment(block, allText);
    } catch (error) {
      console.error("Failed to initialize gallery:", error);
    }
  }
}

function handleAuthoringEnvironment(block, allText) {
  loadCSS(
    `${window.hlx.codeBasePath}/blocks/image-gallery-tile/image-gallery-tile-author.css`
  );
  block.classList.add("igt-authoring-container");

  const allRows = [...block.children];
  const containerRow = allRows.shift();
  const cardRows = allRows;

  if (containerRow && containerRow.textContent.trim()) {
    containerRow.classList.add("igt-authoring-filters");
    const categoryText = containerRow.textContent.trim();
    const categories = [
      allText,
      ...categoryText
        .split(",")
        .map((cat) => cat.trim())
        .filter(Boolean),
    ];

    containerRow.innerHTML = "";

    categories.forEach((category, index) => {
      const item = document.createElement("div");
      item.className = "igt-authoring-filter-item";
      if (index === 0) item.classList.add("active");

      const text = document.createElement("span");
      text.className = `igt-authoring-filter-text ${
        index === 0
          ? "igt-authoring-filter-text-dark"
          : "igt-authoring-filter-text-light"
      }`;
      text.textContent = category;

      item.appendChild(text);
      containerRow.appendChild(item);
    });
  } else if (containerRow) {
    containerRow.style.display = "none";
  }

  const cardsGrid = document.createElement("div");
  cardsGrid.className = "igt-authoring-cards-grid";

  cardRows.forEach((card) => {
    if (card.children.length === 0) return;

    const sections = Array.from(card.children);

    const hasImage = card.querySelector("picture");
    const hasText = sections.some(
      (section) => section.textContent.trim() !== ""
    );

    if (!hasImage && !hasText) return;

    card.classList.add("igt-authoring-card");

    const contentContainer = document.createElement("div");
    contentContainer.className = "igt-authoring-card-content";

    const leftColumn = document.createElement("div");
    leftColumn.className = "igt-authoring-card-left";

    const rightColumn = document.createElement("div");
    rightColumn.className = "igt-authoring-card-right";

    const featuresContainer = document.createElement("div");
    featuresContainer.className = "igt-authoring-card-features";

    const hasContent = (element) => {
      const text = element.textContent.trim();
      return text !== "" && text !== " ";
    };

    sections.forEach((section, index) => {
      switch (index) {
        case 0:
          break;
        case 1:
        case 2:
          section.style.display = "none";
          break;

        case 3:
          if (hasContent(section)) {
            section.classList.add("igt-authoring-card-title");
            leftColumn.appendChild(section);
          } else {
            section.style.display = "none";
          }
          break;

        case 4:
          section.style.display = "none";
          break;

        case 5:
          if (hasContent(section)) {
            section.classList.add("igt-authoring-card-description");
            leftColumn.appendChild(section);
          } else {
            section.style.display = "none";
          }
          break;

        case 6:
          section.style.display = "none";
          break;

        default:
          if (index >= 7) {
            const isSecondToLast = index === sections.length - 2;
            const isLast = index === sections.length - 1;

            if (isSecondToLast && hasContent(section)) {
              section.classList.add("igt-authoring-card-cta");
              leftColumn.appendChild(section);
            } else if (isLast) {
              section.style.display = "none";
            } else {
              if (index % 2 === 1) {
                const textSection = sections[index + 1];
                if (textSection && hasContent(textSection)) {
                  const featureItem = document.createElement("div");
                  featureItem.className = "igt-authoring-card-feature";

                  if (
                    section.querySelector("picture") ||
                    section.querySelector("img")
                  ) {
                    section.classList.add("igt-authoring-card-feature-icon");
                    featureItem.appendChild(section);
                  } else {
                    section.style.display = "none";

                    const iconPlaceholder = document.createElement("div");
                    iconPlaceholder.className =
                      "igt-authoring-card-feature-icon";
                    iconPlaceholder.innerHTML = "📍";
                    featureItem.appendChild(iconPlaceholder);
                  }

                  textSection.classList.add("igt-authoring-card-feature-text");
                  featureItem.appendChild(textSection);
                  featuresContainer.appendChild(featureItem);
                } else {
                  section.style.display = "none";
                  if (textSection) textSection.style.display = "none";
                }
              }
            }
          }
          break;
      }
    });

    let hasLeftContent = leftColumn.children.length > 0;
    let hasRightContent = featuresContainer.children.length > 0;

    if (hasRightContent) {
      rightColumn.appendChild(featuresContainer);
    }

    if (hasLeftContent || hasRightContent) {
      if (hasLeftContent) contentContainer.appendChild(leftColumn);
      if (hasRightContent) contentContainer.appendChild(rightColumn);
      card.appendChild(contentContainer);
      cardsGrid.appendChild(card);
    } else {
      card.style.display = "none";
    }
  });

  if (cardsGrid.children.length > 0) {
    block.appendChild(cardsGrid);
  }
}

function handleLiveEnvironment(block, allText) {
  block.classList.add("image-gallery-tile-container");
  const allRows = [...block.children];
  const containerRow = allRows.shift();
  const cardRows = allRows;

  let categories = [allText];
  if (containerRow) {
    const categoryText = containerRow.textContent.trim();
    const parsedCategories = categoryText
      .split(",")
      .map((cat) => cat.trim())
      .filter(Boolean);
    if (parsedCategories.length > 0) {
      categories = [allText, ...parsedCategories];
    }
  }

  const decoratedCards = [];
  cardRows.forEach((card, cardIndex) => {
    if (card.children.length === 0) return;

    const cardSections = Array.from(card.children);
    let category = "all";
    if (cardSections[6]?.textContent.trim()) {
      category = cardSections[6].textContent.trim();
    }

    const hasContent =
      card.textContent.trim() !== "" || card.querySelector("picture");
    if (!hasContent) return;

    card.classList.add("image-gallery-tile-card");
    card.dataset.category = category.toLowerCase();

    const sections = Array.from(card.children);
    const images = Array.from(card.querySelectorAll("picture")).filter(
      (picture) => {
        const img = picture.querySelector("img");
        return img && !img.src.includes(".svg");
      }
    );

    if (images.length > 0) {
      const imageWrapper = document.createElement("div");
      imageWrapper.className = "image-gallery-tile-images swiper-container";

      const swiperContainer = document.createElement("div");
      swiperContainer.className = `swiper mySwiper-${cardIndex}`;

      const swiperWrapper = document.createElement("div");
      swiperWrapper.className = "swiper-wrapper";

      images.slice(0, 3).forEach((image) => {
        const swiperSlide = document.createElement("div");
        swiperSlide.className = "swiper-slide";
        const imageSection = image.closest("div");
        if (imageSection && imageSection.parentNode === card) {
          swiperSlide.appendChild(image);
          imageSection.style.display = "none";
        }
        swiperWrapper.appendChild(swiperSlide);
      });

      swiperContainer.appendChild(swiperWrapper);

      const nextButton = document.createElement("div");
      nextButton.className = "swiper-button-next";
      swiperContainer.appendChild(nextButton);

      const prevButton = document.createElement("div");
      prevButton.className = "swiper-button-prev";
      swiperContainer.appendChild(prevButton);

      const pagination = document.createElement("div");
      pagination.className = "swiper-pagination";
      swiperContainer.appendChild(pagination);

      imageWrapper.appendChild(swiperContainer);
      card.insertBefore(imageWrapper, card.firstChild);
    }

    const contentContainer = document.createElement("div");
    contentContainer.className = "image-gallery-tile-content";

    const leftColumn = document.createElement("div");
    leftColumn.className = "image-gallery-tile-left";

    const rightColumn = document.createElement("div");
    rightColumn.className = "image-gallery-tile-right";

    let secondCtaText = "";
    let secondCtaUrl = "";

    const lastSections = sections.slice(-2);
    if (lastSections.length >= 2) {
      const potentialSecondCtaText = lastSections[0]?.textContent.trim();
      const potentialSecondCtaUrl = lastSections[1]?.textContent.trim();

      if (
        potentialSecondCtaText &&
        potentialSecondCtaText !== " " &&
        potentialSecondCtaText !== ""
      ) {
        secondCtaText = potentialSecondCtaText;
        if (
          potentialSecondCtaUrl &&
          potentialSecondCtaUrl !== " " &&
          potentialSecondCtaUrl !== ""
        ) {
          secondCtaUrl = potentialSecondCtaUrl;
        }
      }
    }

    sections.forEach((section, index) => {
      switch (index) {
        case 3:
          if (section.textContent.trim()) {
            section.classList.add("image-gallery-tile-title");
            leftColumn.appendChild(section);
            moveInstrumentation(section, section);
          }
          break;

        case 4:
          if (section.textContent.trim()) {
            const linkSection = document.createElement("div");
            linkSection.classList.add("image-gallery-tile-link-section");

            const link = document.createElement("a");
            link.href = section.textContent.trim();
            link.classList.add("image-gallery-tile-link");
            link.removeAttribute("title");

            if (sections[5]?.textContent.trim()) {
              const descriptionText = sections[5].textContent.trim();
              const descElement = document.createElement("p");
              descElement.className = "image-gallery-tile-description";
              descElement.textContent = descriptionText;
              moveInstrumentation(sections[5], descElement);
              link.appendChild(descElement);
            }

            linkSection.appendChild(link);
            leftColumn.appendChild(linkSection);

            if (secondCtaText) {
              const secondCtaSection = document.createElement("div");
              secondCtaSection.className =
                "image-gallery-tile-second-cta-section";
              if (secondCtaUrl) {
                const secondCtaLink = document.createElement("a");
                secondCtaLink.href = secondCtaUrl;
                secondCtaLink.className =
                  "image-gallery-tile-second-cta text-b";
                const textSpan = document.createElement("span");
                textSpan.textContent = secondCtaText;
                const iconSpan = document.createElement("span");
                iconSpan.className = "image-gallery-tile-second-cta-icon";
                iconSpan.innerHTML = `<img src="/icons/chevron_forward.svg" alt="" width="12" height="12">`;
                secondCtaLink.appendChild(textSpan);
                secondCtaLink.appendChild(iconSpan);
                secondCtaSection.appendChild(secondCtaLink);
              } else {
                const secondCtaTextEl = document.createElement("span");
                secondCtaTextEl.className =
                  "image-gallery-tile-second-cta-text";
                secondCtaTextEl.textContent = secondCtaText;
                const iconSpan = document.createElement("span");
                iconSpan.className = "image-gallery-tile-second-cta-icon";
                iconSpan.innerHTML = `<img src="/icons/chevron_forward.svg" alt="" width="12" height="12">`;
                secondCtaSection.appendChild(secondCtaTextEl);
                secondCtaSection.appendChild(iconSpan);
              }
              leftColumn.appendChild(secondCtaSection);
            }
          }
          break;

        case 5:
        case 6:
          section.style.display = "none";
          break;

        default:
          if (index >= 7) {
            const sectionText = section.textContent.trim();
            if (
              (secondCtaText && sectionText === secondCtaText) ||
              (secondCtaUrl && sectionText === secondCtaUrl)
            ) {
              section.style.display = "none";
              break;
            }

            if (index % 2 === 1) {
              const iconSection = section;
              const textSection = sections[index + 1];

              if (
                textSection &&
                textSection.textContent.trim() &&
                textSection.textContent.trim() !== secondCtaText &&
                textSection.textContent.trim() !== secondCtaUrl
              ) {
                let featuresContainer = rightColumn.querySelector(
                  ".image-gallery-tile-features"
                );
                if (!featuresContainer) {
                  featuresContainer = document.createElement("div");
                  featuresContainer.className = "image-gallery-tile-features";
                  rightColumn.appendChild(featuresContainer);
                }
                const featureItem = document.createElement("div");
                featureItem.className = "image-gallery-tile-feature";

                if (iconSection.querySelector("picture")) {
                  iconSection.classList.add("image-gallery-tile-feature-icon");
                  featureItem.appendChild(iconSection);
                  moveInstrumentation(iconSection, featureItem);
                } else {
                  iconSection.style.display = "none";
                }

                textSection.classList.add("image-gallery-tile-feature-text");
                featureItem.appendChild(textSection);
                moveInstrumentation(textSection, featureItem);
                featuresContainer.appendChild(featureItem);
              }
            }
          }
          break;
      }
    });

    if (leftColumn.children.length > 0)
      contentContainer.appendChild(leftColumn);
    contentContainer.appendChild(rightColumn);
    if (contentContainer.children.length > 0) {
      card.appendChild(contentContainer);
      moveInstrumentation(card, contentContainer);
    }

    // setupHoverEffects(card);
    decoratedCards.push(card);
  });

  const originalBlockInstrumentation = [...block.attributes].filter(
    ({ nodeName }) =>
      nodeName.startsWith("data-aue-") || nodeName.startsWith("data-richtext-")
  );

  block.innerHTML = "";

  originalBlockInstrumentation.forEach(({ nodeName, nodeValue }) => {
    block.setAttribute(nodeName, nodeValue);
  });

  if (categories.length > 1) {
    createCategoryTabs(
      block,
      categories.map((cat) => ({ label: cat, value: cat })),
      (category) => {
        block.querySelectorAll(".image-gallery-tile-card").forEach((card) => {
          if (
            category === allText ||
            card.dataset.category === category.toLowerCase()
          ) {
            card.style.display = "flex";
          } else {
            card.style.display = "none";
          }
        });
      },
      allText
    );
  }

  const galleryGrid = document.createElement("div");
  galleryGrid.className = "image-gallery-tile-grid";
  decoratedCards.forEach((card) => galleryGrid.appendChild(card));
  block.appendChild(galleryGrid);
  initializeGallerySwipers();
}

// --- Live Environment Helper Functions ---

function setupHoverEffects(card) {
  const imageSection = card.querySelector(".image-gallery-tile-images");
  const linkSection = card.querySelector(".image-gallery-tile-link-section");
  const secondCtaSection = card.querySelector(
    ".image-gallery-tile-second-cta-section"
  );

  if (imageSection && (linkSection || secondCtaSection)) {
    imageSection.style.cursor = "pointer";
    imageSection.addEventListener("mouseenter", () => {
      if (linkSection) linkSection.classList.add("hovered");
      if (secondCtaSection) secondCtaSection.classList.add("hovered");
    });
    imageSection.addEventListener("mouseleave", () => {
      if (linkSection) linkSection.classList.remove("hovered");
      if (secondCtaSection) secondCtaSection.classList.remove("hovered");
    });
    if (linkSection) {
      linkSection.addEventListener("mouseenter", () =>
        imageSection.classList.add("hovered")
      );
      linkSection.addEventListener("mouseleave", () =>
        imageSection.classList.remove("hovered")
      );
    }
    if (secondCtaSection) {
      secondCtaSection.addEventListener("mouseenter", () =>
        imageSection.classList.add("hovered")
      );
      secondCtaSection.addEventListener("mouseleave", () =>
        imageSection.classList.remove("hovered")
      );
    }
    imageSection.addEventListener("click", (e) => {
      e.preventDefault();
      const primaryLink = linkSection?.querySelector("a");
      const secondaryLink = secondCtaSection?.querySelector("a");
      if (primaryLink && primaryLink.href) {
        window.location.href = primaryLink.href;
      } else if (secondaryLink && secondaryLink.href) {
        window.location.href = secondaryLink.href;
      }
    });
  }
}

function initializeGallerySwipers() {
  document
    .querySelectorAll('[class^="swiper mySwiper-"]')
    .forEach((swiperEl) => {
      new Swiper(swiperEl, {
        navigation: {
          nextEl: swiperEl.querySelector(".swiper-button-next"),
          prevEl: swiperEl.querySelector(".swiper-button-prev"),
        },
        pagination: {
          el: swiperEl.querySelector(".swiper-pagination"),
          clickable: true,
        },
        loop: true,
        autoplay: false,
        watchOverflow: true,
      });
    });
}
