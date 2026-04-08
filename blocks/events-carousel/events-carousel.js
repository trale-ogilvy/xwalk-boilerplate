import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import {
  loadSwiper,
  getDocumentLocale,
  normalToKebab,
  getSite,
} from "../../scripts/utils.js";
import { fetchVenueEvents } from "./events-api.js";
import { moveInstrumentation } from "../../scripts/scripts.js";
import { handleProfileCardTrigger } from "../carousel-card-popup/carousel-card-popup.js";
import { categoriesMap } from "../programs-listings/programs-listings-constants.js";

export default async function decorate(block) {
  if (isUniversalEditor()) {
    await handleAuthoringEnvironment(block);
  } else {
    await handleLiveEnvironment(block);
  }
}

async function handleAuthoringEnvironment(block) {
  loadCSS(
    `${window.hlx.codeBasePath}/blocks/events-carousel/events-carousel-author.css`
  );

  const originalRows = [...block.children];
  const headerConfigRows = originalRows.slice(0, 10);

  const headerData = {
    label: headerConfigRows[0]?.textContent.trim() || "",
    title: headerConfigRows[1]?.textContent.trim() || "",
    ctaText: headerConfigRows[2]?.textContent.trim() || "",
    venue: headerConfigRows[4]?.textContent.trim().toUpperCase() || "",
    category: headerConfigRows[6]?.textContent.trim() || "",
    site: headerConfigRows[7]?.textContent.trim() || "",
    secondaryCtaText: headerConfigRows[8]?.textContent.trim() || "",
  };

  const hasHeaderContent = (data) =>
    Boolean(data.title || data.label || data.ctaText || data.secondaryCtaText);

  // Build the authoring header DOM
  function buildHeader(data) {
    const header = document.createElement("div");
    header.className = "events-carousel__header";
    if (data.label) {
      const labelEl = document.createElement("p");
      labelEl.className = "events-carousel__label";
      labelEl.textContent = data.label;
      header.appendChild(labelEl);
    }
    if (data.title) {
      const titleEl = document.createElement("h2");
      titleEl.className = "events-carousel__title text-h1";
      titleEl.textContent = data.title;
      header.appendChild(titleEl);
    }
    const ctaContainer = document.createElement("div");
    ctaContainer.className = "events-carousel__cta-container";
    if (data.ctaText) {
      const ctaEl = document.createElement("span");
      ctaEl.className = "events-carousel__cta text-b";
      ctaEl.textContent = data.ctaText;
      ctaContainer.appendChild(ctaEl);
    }
    if (data.secondaryCtaText) {
      if (data.ctaText) {
        const separator = document.createElement("span");
        separator.className = "events-carousel__cta-separator";
        separator.textContent = " | ";
        ctaContainer.appendChild(separator);
      }
      const secondaryCtaEl = document.createElement("span");
      secondaryCtaEl.className =
        "events-carousel__cta events-carousel__secondary-cta text-b";
      secondaryCtaEl.textContent = data.secondaryCtaText;
      ctaContainer.appendChild(secondaryCtaEl);
    }
    if (ctaContainer.children.length > 0) header.appendChild(ctaContainer);
    return header;
  }

  // Build a preview slide (row + processRow)
  function buildAuthoringSlide(event, site) {
    const row = document.createElement("div");
    const imageCell = document.createElement("div");
    if (event.images?.[0]?._publishUrl) {
      const picture = document.createElement("picture");
      const img = document.createElement("img");
      img.src = event.images[event.imageIdx]._publishUrl;
      img.alt = event.title;
      picture.appendChild(img);
      imageCell.appendChild(picture);
    }
    const labelCell = document.createElement("div");
    labelCell.textContent = event.category;
    const titleCell = document.createElement("div");
    titleCell.textContent = event.title;
    const descCell = document.createElement("div");
    descCell.textContent = event.description;
    const timeCell = document.createElement("div");
    timeCell.textContent = event.displayTiming || "";
    const venueCell = document.createElement("div");
    venueCell.textContent = event.venue || "";
    row.append(imageCell, labelCell, titleCell, descCell, timeCell, venueCell);
    row.dataset.displayDate = event.displayDate;

    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    processRow(row, [], slide, site || getSite());
    return slide;
  }

  block.innerHTML = ""; // Clear original content

  if (hasHeaderContent(headerData)) {
    block.appendChild(buildHeader(headerData));
  }

  const scrollContainer = document.createElement("div");
  scrollContainer.className = "ec-authoring-scroll-container";

  // Fetch events from API and build card previews
  const events = await fetchVenueEvents(
    headerData.venue,
    headerData.category,
    headerData.site
  );

  if (events.length === 0) {
    const noEventsMessage = document.createElement("p");
    noEventsMessage.textContent =
      "No events found for the current configuration.";
    noEventsMessage.className = "ec-authoring-no-events";
    scrollContainer.appendChild(noEventsMessage);
  } else {
    for (const event of events) {
      scrollContainer.appendChild(buildAuthoringSlide(event, headerData.site));
    }
  }

  block.appendChild(scrollContainer);
}

async function handleLiveEnvironment(block) {
  const originalRows = [...block.children];
  const containerPropRows = originalRows.slice(0, 10);

  const extractLink = (row) => {
    if (!row) return "";
    const link = row.querySelector("a")?.href;
    if (link) return link;
    const text = row.textContent.trim();
    return text.match(/^https?:\/\//) ? text : "";
  };

  const headerData = {
    label: containerPropRows[0]?.textContent.trim() || "",
    title: containerPropRows[1]?.textContent.trim() || "",
    ctaText: containerPropRows[2]?.textContent.trim() || "",
    ctaLink: extractLink(containerPropRows[3]),
    venue: containerPropRows[4]?.textContent.trim().toUpperCase() || "",
    bgColor: containerPropRows[5]?.textContent.trim() || "",
    category: containerPropRows[6]?.textContent.trim() || "",
    site: containerPropRows[7]?.textContent.trim() || "",
    secondaryCtaText: containerPropRows[8]?.textContent.trim() || "",
    secondaryCtaLink: extractLink(containerPropRows[9]),
  };

  block.innerHTML = "";

  if (headerData.bgColor) {
    const section = block.closest(".section");
    if (section) {
      section.style.backgroundColor = headerData.bgColor;
      block.classList.add("has-custom-bg");
      if (
        headerData.bgColor.toLowerCase() === "#fff" ||
        headerData.bgColor.toLowerCase() === "#ffffff" ||
        headerData.bgColor.toLowerCase() === "white" ||
        headerData.bgColor.replace(/\s/g, "").toLowerCase() ===
          "rgb(255,255,255)"
      ) {
        block.classList.add("is-bg-white");
      }
    }
  }

  if (
    headerData.title ||
    headerData.label ||
    headerData.ctaText ||
    headerData.secondaryCtaText
  ) {
    const header = document.createElement("div");
    header.className = "events-carousel__header";
    moveInstrumentation(originalRows[0], header);
    if (headerData.label) {
      const labelEl = document.createElement("p");
      labelEl.className = "events-carousel__label";
      labelEl.textContent = headerData.label;
      moveInstrumentation(originalRows[0].children[0], labelEl);
      header.appendChild(labelEl);
    }
    if (headerData.title) {
      const titleEl = document.createElement("h2");
      titleEl.className = "events-carousel__title text-h1";
      titleEl.textContent = headerData.title;
      moveInstrumentation(originalRows[1].children[0], titleEl);
      header.appendChild(titleEl);
    }
    const ctaContainer = document.createElement("div");
    ctaContainer.className = "events-carousel__cta-container";
    if (headerData.ctaText) {
      const ctaEl = document.createElement(headerData.ctaLink ? "a" : "span");
      ctaEl.className = "events-carousel__cta text-b";
      if (headerData.ctaLink) ctaEl.href = headerData.ctaLink;
      if (originalRows[2]?.children?.[0]) {
        moveInstrumentation(originalRows[2].children[0], ctaEl);
      }
      const ctaTextSpan = document.createElement("span");
      ctaTextSpan.textContent = headerData.ctaText;
      ctaEl.appendChild(ctaTextSpan);
      ctaContainer.appendChild(ctaEl);
    }
    if (headerData.secondaryCtaText) {
      if (headerData.ctaText) {
        const separator = document.createElement("span");
        separator.className = "events-carousel__cta-separator";
        separator.textContent = " | ";
        ctaContainer.appendChild(separator);
      }
      const secondaryCtaEl = document.createElement(
        headerData.secondaryCtaLink ? "a" : "span"
      );
      secondaryCtaEl.className =
        "events-carousel__cta events-carousel__secondary-cta text-b";
      if (headerData.secondaryCtaLink)
        secondaryCtaEl.href = headerData.secondaryCtaLink;
      if (originalRows[8]?.children?.[0]) {
        moveInstrumentation(originalRows[8].children[0], secondaryCtaEl);
      }
      const secondaryCtaTextSpan = document.createElement("span");
      secondaryCtaTextSpan.textContent = headerData.secondaryCtaText;
      secondaryCtaEl.appendChild(secondaryCtaTextSpan);
      ctaContainer.appendChild(secondaryCtaEl);
    }
    if (ctaContainer.children.length > 0) {
      header.appendChild(ctaContainer);
    }
    block.appendChild(header);
  }

  block.classList.add("swiper-highlight4-container");
  const swiperContainer = document.createElement("div");
  swiperContainer.className =
    "swiper-container-highlight4 swiper-highlight4-card";
  moveInstrumentation(block, swiperContainer);
  const swiperWrapper = document.createElement("div");
  swiperWrapper.className = "swiper-wrapper";
  moveInstrumentation(block, swiperWrapper);
  const arrowsContainer = document.createElement("div");
  arrowsContainer.className = "swiper-highlight4-arrows-container";
  moveInstrumentation(block, arrowsContainer);
  const leftArrow = document.createElement("button");
  leftArrow.className = "swiper-highlight4-arrow-button highlight4-left-arrow";
  leftArrow.innerHTML = `<div class="highlight4-arrow-icon"></div>`;
  leftArrow.setAttribute("aria-label", "Previous Slide");
  leftArrow.style.opacity = "0";
  moveInstrumentation(block, leftArrow);
  const rightArrow = document.createElement("button");
  rightArrow.className =
    "swiper-highlight4-arrow-button highlight4-right-arrow";
  rightArrow.innerHTML = `<div class="highlight4-arrow-icon"></div>`;
  rightArrow.setAttribute("aria-label", "Next Slide");
  moveInstrumentation(block, rightArrow);
  arrowsContainer.append(leftArrow, rightArrow);
  block.appendChild(arrowsContainer);

  // Helpers to build event row/slide in live environment
  function buildEventRowFromEvent(event) {
    const row = document.createElement("div");
    row.dataset.displayDate = event.displayDate;

    const imageCell = document.createElement("div");
    if (event.images?.[0]?._publishUrl) {
      const picture = document.createElement("picture");
      const img = document.createElement("img");
      img.src = event.images[event.imageIdx]._publishUrl;
      img.alt = event.title;
      picture.appendChild(img);
      imageCell.appendChild(picture);
    }
    const labelCell = document.createElement("div");
    labelCell.textContent = event.category;
    const titleCell = document.createElement("div");
    titleCell.textContent = event.title;
    const descCell = document.createElement("div");
    descCell.textContent = event.description;
    const timeCell = document.createElement("div");
    timeCell.textContent = event.displayTiming || "";
    const venueCell = document.createElement("div");
    venueCell.textContent = event.venue || "";
    row.append(imageCell, labelCell, titleCell, descCell, timeCell, venueCell);
    return row;
  }

  function buildLiveSlide(event, site, cards) {
    const row = buildEventRowFromEvent(event);
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    const resolvedSite = site || getSite();
    processRow(row, cards, slide, resolvedSite);

    // Wire up click handler for profile card popup
    const card = slide.querySelector(".highlight4-card");
    if (card) {
      card.style.cursor = "pointer";
      card.addEventListener("click", (e) => {
        loadCSS(
          `${window.hlx.codeBasePath}/blocks/carousel-card-popup/carousel-card-popup.css`
        );
        const cardData = {
          title: event.title,
          description: event.description,
          dedicatedDescription:
            event.modalDescription?.plaintext || event.description,
          image: event.images?.[event.imageIdx]?._publishUrl,
          labelTag: event.category,
          popupTitle: event.title,
          dateRange: event.fullDate,
          timeRange: event.displayTiming,
          location: event.venue,
          ctaText: event.ctaText,
          ctaLink: event.ctaLink,
        };
        handleProfileCardTrigger(e, { cardData }, resolvedSite);
      });
    }
    return slide;
  }

  const cards = [];
  const events = await fetchVenueEvents(
    headerData.venue,
    headerData.category,
    headerData.site
  );
  if (events.length === 0) {
    block.style.display = "none";
    return;
  }

  for (const event of events) {
    const slide = buildLiveSlide(event, headerData.site, cards);
    swiperWrapper.appendChild(slide);
  }

  swiperContainer.appendChild(swiperWrapper);
  block.appendChild(swiperContainer);

  await loadSwiper();
  const positionArrows = (swiper) => {
    const swiperTopOffset = swiper.el.offsetTop;
    const swiperHeight = swiper.el.offsetHeight;
    if (swiperHeight > 0) {
      const centerPoint = swiperTopOffset + swiperHeight / 2;
      arrowsContainer.style.top = `${centerPoint}px`;
      arrowsContainer.style.height = "0px";
    }
  };
  const swiper = new Swiper(swiperContainer, {
    slidesPerView: 1.25,
    spaceBetween: 24,
    freeMode: true,
    keyboard: { enabled: true, onlyInViewport: true },
    watchOverflow: true,
    preventClicksPropagation: true,
    resistance: true,
    resistanceRatio: 0.85,
    mousewheel: { forceToAxis: true },
    breakpoints: { 640: { slidesPerView: 2 }, 1500: { slidesPerView: 3 } },
    navigation: { nextEl: rightArrow, prevEl: leftArrow },
    on: {
      init: (s) => {
        updateArrowVisibility(s);
        positionArrows(s);
      },
      progress: (s) => updateArrowVisibility(s),
      slideChange: (s) => positionArrows(s),
      resize: (s) => positionArrows(s),
    },
  });
  function updateArrowVisibility(s) {
    leftArrow.style.opacity = s.isBeginning ? "0" : "1";
    rightArrow.style.opacity = s.isEnd ? "0" : "1";
    leftArrow.style.pointerEvents = s.isBeginning ? "none" : "auto";
    rightArrow.style.pointerEvents = s.isEnd ? "none" : "auto";
  }
  if (window.ResizeObserver && cards.length) {
    const resizeObserver = new ResizeObserver(() => positionArrows(swiper));
    cards.forEach((card) => resizeObserver.observe(card));
  }
}

function setupHighlightCardHover(card) {
  if (window.innerWidth < 768) return;

  const imageWrapper = card.querySelector(".highlight4-image-container");
  const content = card.querySelector(".highlight4-card-content");

  if (imageWrapper && content) {
    imageWrapper.addEventListener("mouseenter", () => {
      content.classList.add("hovered");
    });
    imageWrapper.addEventListener("mouseleave", () => {
      content.classList.remove("hovered");
    });

    content.addEventListener("mouseenter", () => {
      imageWrapper.classList.add("hovered");
    });
    content.addEventListener("mouseleave", () => {
      imageWrapper.classList.remove("hovered");
    });
  }
}

function processRow(row, cards, targetContainer, site) {
  const card = document.createElement("div");
  card.className = "highlight4-card";
  cards.push(card);
  moveInstrumentation(row, card);

  const sections = Array.from(row.children);
  const [imageCell, labelCell, titleCell, descCell, timeCell, venueCell] =
    sections;
  const picture = imageCell?.querySelector("picture");

  if (picture) {
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "highlight4-image-container";
    imageWrapper.appendChild(picture);
    card.appendChild(imageWrapper);
  }

  const cardContent = document.createElement("div");
  cardContent.className = "highlight4-card-content";
  moveInstrumentation(row, cardContent);

  if (row.dataset.displayDate) {
    const displayDate = new Date(row.dataset.displayDate);
    const calendarContainer = document.createElement("div");
    calendarContainer.className = "highlight4-calendar-container";
    moveInstrumentation(row, calendarContainer);

    const weekday = document.createElement("div");
    weekday.className = "highlight4-calendar-weekday";

    weekday.textContent = displayDate.toLocaleDateString(getDocumentLocale(), {
      weekday: "short",
    });

    const dayMonth = document.createElement("div");
    dayMonth.className = "highlight4-calendar-day-month";

    dayMonth.textContent = displayDate.toLocaleDateString(getDocumentLocale(), {
      day: "numeric",
      month: "short",
    });

    calendarContainer.append(weekday, dayMonth);
    card.appendChild(calendarContainer);
  }

  const mainRow = document.createElement("div");
  mainRow.className = "highlight4-card-content__main-row";
  moveInstrumentation(row, mainRow);
  const leftCol = document.createElement("div");
  leftCol.className = "highlight4-card-content__left-col";
  moveInstrumentation(row, leftCol);
  const rightCol = document.createElement("div");
  rightCol.className = "highlight4-card-content__right-col";
  moveInstrumentation(row, rightCol);
  if (labelCell?.textContent.trim()) {
    const labelEl = document.createElement("div");
    labelEl.className = "highlight4-card-label text-l2";
    labelEl.innerHTML = `<p>${
      categoriesMap.events[site?.toLowerCase()]?.categories[
        normalToKebab(labelCell.textContent)
      ] || labelCell.textContent
    }</p>`;
    leftCol.appendChild(labelEl);
  }
  if (titleCell?.textContent.trim()) {
    const titleEl = document.createElement("h3");
    titleEl.className = "highlight4-card-title text-h3";
    titleEl.textContent = titleCell.textContent;
    leftCol.appendChild(titleEl);
  }
  const timeLine = createIconLine(timeCell, "clock");
  const venueLine = createIconLine(venueCell, "location");
  if (timeLine) {
    rightCol.appendChild(timeLine);
  }
  if (venueLine) {
    rightCol.appendChild(venueLine);
  }

  mainRow.append(leftCol, rightCol);
  cardContent.append(mainRow);
  card.appendChild(cardContent);
  targetContainer.appendChild(card);
  setupHighlightCardHover(card);
}

function createIconLine(cell, defaultIconName) {
  if (!cell || !cell.textContent.trim()) return null;
  const text = cell.textContent.trim();
  let iconName = defaultIconName;
  let iconText = text;
  if (text.includes("|")) {
    const parts = text.split("|").map((s) => s.trim());
    iconName = parts[0];
    iconText = parts[1];
  }
  const item = document.createElement("div");
  item.className = "highlight4-card-icon-line text-p1";
  const icon = document.createElement("div");
  icon.className = `highlight4-card-icon icon-${iconName.toLowerCase()}`;
  const p = document.createElement("p");
  p.className = "highlight4-card-icon-text text-p1";
  p.textContent = iconText;
  item.append(icon, p);
  return item;
}
