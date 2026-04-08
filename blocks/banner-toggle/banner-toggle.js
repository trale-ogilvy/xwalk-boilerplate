import { moveInstrumentation } from "../../scripts/scripts.js";
import { decorateIcons, createOptimizedPicture } from "../../scripts/aem.js";
import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import { loadSwiper } from "../../scripts/utils.js";

function handleAuthoringEnvironment(block) {
  loadCSS(
    `${window.hlx.codeBasePath}/blocks/banner-toggle/banner-toggle-author.css`
  );

  const cardGroups = [...block.children];
  block.innerHTML = "";

  const authoringWrapper = document.createElement("div");
  authoringWrapper.className = "bt-authoring-wrapper";

  cardGroups.forEach((group) => {
    group.classList.add("bt-authoring-card");
    authoringWrapper.append(group);
  });

  block.append(authoringWrapper);
}

async function handleLiveEnvironment(block) {
  // --- Helper Functions ---
  function formatDate(dateInput) {
    if (!dateInput) return "";
    const date =
      dateInput instanceof Date && !isNaN(dateInput)
        ? dateInput
        : new Date(dateInput);
    if (isNaN(date)) return dateInput;

    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  // Shared image breakpoints for optimized pictures
  const IMAGE_BREAKPOINTS = [
    { media: "(min-width: 1600px)", width: "3200" },
    { media: "(min-width: 1200px)", width: "2400" },
    { media: "(min-width: 900px)", width: "1800" },
    { media: "(min-width: 600px)", width: "1400" },
    { width: "1200" },
  ];

  // Normalize event date fields into a single human-readable string
  function computeEventDateString(eventData) {
    if (!eventData) return "";
    if (eventData.displayDate) return formatDate(eventData.displayDate);
    if (eventData.fullDate) {
      const parsedFullDate = new Date(eventData.fullDate);
      return isNaN(parsedFullDate)
        ? eventData.fullDate
        : formatDate(parsedFullDate);
    }
    const range = eventData.dateRange;
    if (Array.isArray(range) && range.length === 2) {
      return `${formatDate(range[0])} - ${formatDate(range[1])}`;
    }
    if (Array.isArray(range) && range.length === 1) {
      return formatDate(range[0]);
    }
    if (eventData.date) return formatDate(eventData.date);
    return "";
  }

  // Create an arrow navigation button with a consistent structure
  function createArrowButton(className, ariaLabel) {
    const btn = document.createElement("button");
    btn.className = `banner-toggle-arrow-button ${className}`;
    btn.innerHTML = '<div class="banner-toggle-arrow-icon"></div>';
    btn.setAttribute("aria-label", ariaLabel);
    return btn;
  }

  // Given a <picture>, create and return an optimized picture element with instrumentation moved
  function getOptimizedPictureFromPicture(picEl, classList = []) {
    if (!picEl) return null;
    const img = picEl.querySelector("img");
    if (!img) return null;
    const optimized = createOptimizedPicture(
      img.src,
      img.alt,
      false,
      IMAGE_BREAKPOINTS
    );
    const optimizedImg = optimized.querySelector("img");
    if (optimizedImg) moveInstrumentation(img, optimizedImg);
    if (classList?.length) optimized.classList.add(...classList);
    return optimized;
  }

  // Render a compact date badge (e.g., Mon 12 OCT) used in the static card
  function renderDateBadge(date) {
    if (!date || isNaN(date)) return null;
    const container = document.createElement("div");
    container.className = "banner-static-card-date-container text-l3";
    const dayOfWeek = date
      .toLocaleString("default", { weekday: "short" })
      .toUpperCase();
    const day = date.getDate();
    const month = date
      .toLocaleString("default", { month: "short" })
      .toUpperCase();
    const dowEl = document.createElement("span");
    dowEl.className = "date-day-of-week";
    dowEl.textContent = dayOfWeek;
    const dmEl = document.createElement("span");
    dmEl.className = "date-day-month";
    dmEl.textContent = `${day} ${month}`;
    container.append(dowEl, dmEl);
    return container;
  }

  function createEventModal() {
    let modal = document.createElement("div");
    modal.className = "banner-event-modal";
    modal.innerHTML = `
      <div class="event-modal-content">
        <div class="event-modal-image"></div>
        <div class="event-modal-text"></div>
        <button class="event-modal-close text-b close-icon icon-left" aria-label="Close modal">
          <span class="animate-underline">CLOSE</span>
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  function showEventModal(eventData) {
    let modal = document.querySelector(".banner-event-modal");
    if (!modal) modal = createEventModal();

    const imgUrl =
      eventData.images && eventData.images.length > 0
        ? eventData.images[0]._publishUrl
        : "";
    const category = eventData.category || "";
    const title = eventData.title || "";
    const description = eventData.description || "";
    const venue = eventData.venue || "";
    const ctaText = eventData.ctaText || "";
    const ctaLink = eventData.ctaLink || "";

    const dateStr = computeEventDateString(eventData);

    const timing = eventData.displayTiming || eventData.timing || "";

    // Fill image
    modal.querySelector(".event-modal-image").innerHTML = imgUrl
      ? `<img src="${imgUrl}" alt="${title}" />`
      : "";

    if (typeof window.activityFilter === "undefined") {
      window.activityFilter = "";
    }
    let showDetails = window.activityFilter !== "resort";

    modal.querySelector(".event-modal-text").innerHTML = `
      ${category && `<p class="event-modal-category text-l2">${category}</p>`}
      <h3 class="event-modal-title text-h3">${title}</h3>
      ${description && `<p class="event-modal-desc text-p2">${description}</p>`}
      <div class="event-modal-details">
        ${
          showDetails && dateStr
            ? `<p class="event-modal-dates calendar-icon text-p2">${dateStr}</p>`
            : ""
        }
        ${
          showDetails && timing
            ? `<p class="event-modal-timing clock-icon text-p2">${timing}</p>`
            : ""
        }
        ${
          showDetails && venue
            ? `<p class="event-modal-venue venue-icon text-p2">${venue}</p>`
            : ""
        }
      </div>
      ${
        ctaText && ctaLink
          ? `<a class="event-modal-cta cta-link chevron-right text-b" href="${ctaLink}"><span class="animate-underline">${ctaText}</span></a>`
          : ctaText
          ? `<p class="event-modal-cta text-b">${ctaText}</p>`
          : ""
      }
    `;

    modal.classList.add("active");
    modal.classList.remove("inactive");
    document.body.style.overflow = "hidden";

    // Close logic
    function closeModal() {
      modal.classList.remove("active");
      modal.classList.add("inactive");
      document.body.style.overflow = "";
    }

    modal.querySelector(".event-modal-close").onclick = closeModal;

    modal.onclick = (e) => {
      if (!modal.querySelector(".event-modal-content").contains(e.target)) {
        closeModal();
      }
    };

    // Close on Escape key
    document.addEventListener("keydown", function escHandler(e) {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", escHandler);
      }
    });
  }
  // --- End of Helper Functions ---

  let modal = createEventModal();
  modal.classList.add("inactive");
  moveInstrumentation(block);

  block.classList.add("banner-toggle-container");

  const parallaxWrapper = document.createElement("section");
  parallaxWrapper.className = "banner-toggle-parallax-wrapper";

  const originalContent = document.createElement("div");
  originalContent.className = "banner-toggle-content";

  while (block.firstChild) {
    originalContent.appendChild(block.firstChild);
  }

  parallaxWrapper.appendChild(originalContent);
  block.appendChild(parallaxWrapper);

  const bannerToggle =
    originalContent.querySelector(".banner-toggle") || originalContent;
  const arrowsContainer =
    originalContent.querySelector(".banner-toggle-arrows-container") ||
    document.createElement("div");
  arrowsContainer.className = "banner-toggle-arrows-container";

  const swiperContainer =
    originalContent.querySelector(".banner-toggle-swiper") ||
    document.createElement("div");
  swiperContainer.className = "banner-toggle-swiper swiper";

  const swiperWrapper =
    swiperContainer.querySelector(".swiper-wrapper") ||
    document.createElement("div");
  swiperWrapper.className = "swiper-wrapper";

  swiperContainer.innerHTML = "";
  swiperContainer.append(swiperWrapper);

  let prevArrow = arrowsContainer.querySelector(".banner-toggle-prev-arrow");
  let nextArrow = arrowsContainer.querySelector(".banner-toggle-next-arrow");

  if (!prevArrow) {
    prevArrow = createArrowButton("banner-toggle-prev-arrow", "Previous Slide");
  }

  if (!nextArrow) {
    nextArrow = createArrowButton("banner-toggle-next-arrow", "Next Slide");
  }

  arrowsContainer.innerHTML = "";
  arrowsContainer.append(prevArrow, nextArrow);

  const cardGroups = Array.from(bannerToggle.children).filter(
    (el) =>
      el.tagName === "DIV" &&
      !el.classList.contains("banner-toggle-arrows-container") &&
      !el.classList.contains("banner-toggle-swiper")
  );

  if (cardGroups.length === 0) {
    console.warn("No card groups found in banner-toggle block");
    return;
  }

  for (const cardGroup of cardGroups) {
    if (!cardGroup.children || cardGroup.children.length < 2) continue;

    const slide = document.createElement("div");
    slide.className = "swiper-slide";

    const dimmingOverlay = document.createElement("div");
    dimmingOverlay.className = "slide-dim-overlay";
    slide.appendChild(dimmingOverlay);

    const slideContent = document.createElement("div");
    slideContent.className = "banner-card-content";

    const toggleContainer = document.createElement("div");
    toggleContainer.className = "banner-toggle-controls";

    const toggleThumb = document.createElement("div");
    toggleThumb.className = "banner-toggle-thumb";

    const dayButton = document.createElement("button");
    dayButton.className = "banner-toggle-button day-toggle active";
    dayButton.innerHTML = '<div class="banner-toggle-day-icon"></div>';
    dayButton.setAttribute("aria-label", "Show day view");

    const nightButton = document.createElement("button");
    nightButton.className = "banner-toggle-button night-toggle";

    const isSeasonalCell = cardGroup.children[13];
    const isSeasonal =
      isSeasonalCell?.textContent?.trim().toLowerCase() === "true";

    if (isSeasonal) {
      nightButton.innerHTML = '<div class="banner-toggle-seasonal-icon"></div>';
      nightButton.setAttribute("aria-label", "Show seasonal view");
      nightButton.classList.add("seasonal-toggle");
    } else {
      nightButton.innerHTML = '<div class="banner-toggle-night-icon"></div>';
      nightButton.setAttribute("aria-label", "Show night view");
    }

    toggleContainer.append(dayButton, nightButton, toggleThumb);

    const imageContainer = document.createElement("div");
    imageContainer.className = "banner-image-container";

    const dayImage = cardGroup.children[0]
      ?.querySelector("picture")
      ?.cloneNode(true);

    const nightImage = cardGroup.children[1]
      ?.querySelector("picture")
      ?.cloneNode(true);

    let optimizedDayImage = getOptimizedPictureFromPicture(dayImage, [
      "banner-image",
      "day-image",
      "active",
    ]);
    if (optimizedDayImage) imageContainer.append(optimizedDayImage);
    let optimizedNightImage = getOptimizedPictureFromPicture(
      nightImage,
      isSeasonal
        ? ["banner-image", "seasonal-image"]
        : ["banner-image", "night-image"]
    );
    if (optimizedNightImage) imageContainer.append(optimizedNightImage);

    slideContent.append(imageContainer);

    const textWrapper = document.createElement("div");
    textWrapper.className = "banner-text-wrapper";

    const processContent = (cell, className, tagName = "div") => {
      if (cell && cell.firstElementChild) {
        const el = document.createElement(tagName);
        el.className = className;
        el.innerHTML = cell.innerHTML;
        return el;
      }
      return null;
    };

    const labelEl = processContent(
      cardGroup.children[2],
      "banner-label text-l2"
    );
    const titleEl = processContent(
      cardGroup.children[3],
      "banner-title text-t4",
      "h2"
    );

    if (labelEl) textWrapper.append(labelEl);
    if (titleEl) textWrapper.append(titleEl);

    const ctaTextCell = cardGroup.children[4];
    const ctaLinkCell = cardGroup.children[5];
    const staticCardImageCell = cardGroup.children[6];
    const staticCardLabelCell = cardGroup.children[7];
    const staticCardTitleCell = cardGroup.children[8];
    const staticCardDateCell = cardGroup.children[9];

    if (ctaTextCell && ctaLinkCell) {
      const ctaLink = ctaLinkCell.querySelector("a");
      if (ctaLink) {
        const ctaContainer = document.createElement("div");
        ctaContainer.className = "banner-cta-container";
        const ctaButton = document.createElement("a");
        ctaButton.className = "banner-cta-button text-b";
        ctaButton.href = ctaLink.href;
        ctaButton.innerHTML = `<span>${ctaTextCell.innerHTML.trim()}</span>`;
        ctaContainer.append(ctaButton);
        textWrapper.append(ctaContainer);
      }
    }

    if (dayImage && nightImage) {
      textWrapper.append(toggleContainer);
    } else {
      const hasStaticCardImage = staticCardImageCell?.querySelector("picture");
      const hasStaticCardLabel = staticCardLabelCell?.textContent.trim();
      const hasStaticCardTitle = staticCardTitleCell?.textContent.trim();
      const hasStaticCardDate = staticCardDateCell?.textContent.trim();

      if (
        hasStaticCardImage &&
        (nearestEventDetails ||
          hasStaticCardLabel ||
          hasStaticCardTitle ||
          hasStaticCardDate)
      ) {
        const staticCard = document.createElement("div");
        staticCard.className = "banner-static-card";

        const cardImage = staticCardImageCell
          .querySelector("picture")
          .cloneNode(true);
        cardImage.className = "banner-static-card-image";
        staticCard.append(cardImage);

        const cardContent = document.createElement("div");
        cardContent.className = "banner-static-card-content";

        if (nearestEventDate && !isNaN(nearestEventDate)) {
          const badge = renderDateBadge(nearestEventDate);
          if (badge) cardContent.append(badge);
        } else if (hasStaticCardDate) {
          const parsed = new Date(staticCardDateCell.textContent.trim());
          const badge = renderDateBadge(parsed);
          if (badge) cardContent.append(badge);
        }

        const cardTextContent = document.createElement("div");
        cardTextContent.className = "banner-static-card-text-content";

        if (hasStaticCardLabel) {
          const cardLabel = document.createElement("p");
          cardLabel.className = "banner-static-card-label text-l2";
          cardLabel.textContent = staticCardLabelCell.textContent.trim();
          cardTextContent.append(cardLabel);
        }

        const cardTitle = document.createElement("p");
        cardTitle.className = "banner-static-card-title text-p3";

        cardTitle.textContent = nearestEventDetails
          ? nearestEventTitle
          : hasStaticCardTitle || "N/A";
        cardTextContent.append(cardTitle);

        cardContent.append(cardTextContent);
        staticCard.append(cardContent);

        if (nearestEventDetails) {
          staticCard.style.cursor = "pointer";
          staticCard.addEventListener("click", (e) => {
            e.stopPropagation();
            showEventModal(nearestEventDetails);
          });
        }

        textWrapper.append(staticCard);
      }
    }

    slideContent.append(textWrapper);

    if (dayImage && nightImage) {
      const setToggleState = (isDay) => {
        dayButton.classList.toggle("active", isDay);
        nightButton.classList.toggle("active", !isDay);
        toggleThumb.style.transform = isDay
          ? "translateX(0)"
          : "translateX(100%)";
        if (optimizedDayImage)
          optimizedDayImage.classList.toggle("active", isDay);
        if (optimizedNightImage)
          optimizedNightImage.classList.toggle("active", !isDay);
      };
      dayButton.addEventListener("click", () => setToggleState(true));
      nightButton.addEventListener("click", () => setToggleState(false));
    } else {
      toggleContainer.style.display = "none";
    }

    slide.append(slideContent);
    swiperWrapper.append(slide);
  }

  bannerToggle.innerHTML = "";
  bannerToggle.append(arrowsContainer, swiperContainer);

  const pagination = document.createElement("div");
  pagination.className = "swiper-pagination banner-swiper-pagination";
  swiperContainer.append(pagination);

  try {
    await loadSwiper();

    if (swiperWrapper.children.length > 0) {
      const swiper = new Swiper(swiperContainer, {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: cardGroups.length > 1,
        speed: 1000,
        effect: "slide",
        keyboard: { enabled: true, onlyInViewport: true },
        navigation: {
          nextEl: nextArrow,
          prevEl: prevArrow,
        },
        pagination: {
          el: pagination,
          type: "bullets",
          clickable: true,
          bulletClass: "swiper-pagination-bullet",
          bulletActiveClass: "swiper-pagination-bullet-active",
          renderBullet: function (index, className) {
            return `<span class="${className}">
                      <span class="progress-bar"></span>
                    </span>`;
          },
        },
        on: {
          init: (s) => {
            updateArrowVisibility(s);
            resetProgressBars();
          },
          slideChange: (s) => {
            updateArrowVisibility(s);
            resetProgressBars();
          },
          autoplayTimeLeft: (s, time, progress) => {
            updateProgressRing(s, progress);
          },
        },
      });

      updateArrowVisibility(swiper);
    }
  } catch (error) {
    console.error("Failed to initialize Swiper:", error);
  }

  function updateArrowVisibility(swiper) {
    if (!prevArrow || !nextArrow || swiper.params.loop) {
      if (prevArrow) prevArrow.style.opacity = "1";
      if (nextArrow) nextArrow.style.opacity = "1";
      return;
    }
    prevArrow.style.opacity = swiper.isBeginning ? "0.5" : "1";
    nextArrow.style.opacity = swiper.isEnd ? "0.5" : "1";
    prevArrow.style.pointerEvents = swiper.isBeginning ? "none" : "auto";
    nextArrow.style.pointerEvents = swiper.isEnd ? "none" : "auto";
  }

  function resetProgressBars() {
    const allBullets = pagination.querySelectorAll(".swiper-pagination-bullet");
    allBullets.forEach((bullet) => {
      const bar = bullet.querySelector(".progress-bar");
      if (bar) {
        bar.style.width = "0%";
      }
    });
  }

  function updateProgressRing(swiper, progress) {
    const activeBullet = pagination.querySelector(
      ".swiper-pagination-bullet-active"
    );
    if (activeBullet) {
      const bar = activeBullet.querySelector(".progress-bar");
      if (bar) {
        const width = (1 - progress) * 100;
        bar.style.width = `${width}%`;
      }
    }
  }

  decorateIcons(prevArrow);
  decorateIcons(nextArrow);

  // setTimeout(() => parallaxSection(parallaxWrapper), 100);
}

export default async function decorate(block) {
  if (isUniversalEditor()) {
    handleAuthoringEnvironment(block);
  } else {
    await handleLiveEnvironment(block);
  }
}
