import { getBasePathBasedOnEnv } from "../../scripts/utils.js";
import { createOptimizedPicture } from "../../scripts/aem.js";
import {
  supportedSites,
  supportedLangs,
  VALID_CATEGORIES,
} from "../../constants.js";

const CONTENT_PREFIX = "/content/patina";

function trimSlashes(str) {
  let result = str;
  while (result.startsWith("/")) result = result.substring(1);
  while (result.endsWith("/")) result = result.slice(0, -1);
  return result;
}

export function parseUserPath(userPath) {
  const cleanPath = trimSlashes(userPath.trim());
  const segments = cleanPath.split("/");

  const categoryPath = segments.slice(0, 3).join("/");
  const result = `${CONTENT_PREFIX}/${categoryPath}`;

  return result;
}

export async function fetchCardData(paths) {
  const apiUrl = `${getBasePathBasedOnEnv()}/bin/chg/pagelist.json?${paths
    .map((p) => `paths=${p}`)
    .join("&")}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    const data = await response.json();

    return data.data || [];
  } catch (error) {
    console.error("Error fetching card data:", error);
    return [];
  }
}

export function getPropertyAndLanguageFromUrl() {
  const currentPath = globalThis.location.pathname;
  const pathSegments = currentPath.split("/").filter(Boolean);

  if (pathSegments.length === 0) return null;

  const property = pathSegments[0];

  if (!supportedSites.includes(property)) {
    console.warn(`Unsupported property in URL: ${property}`);
    return null;
  }

  let language = "en";
  if (pathSegments.length >= 2 && supportedLangs.includes(pathSegments[1])) {
    language = pathSegments[1];
  }

  return { property, language };
}

export function getAllCategoriesForProperty(property, language) {
  const allCategories = VALID_CATEGORIES[property];
  if (!allCategories) {
    console.warn(`No categories found for property: ${property}`);
    return [];
  }

  return allCategories.map(
    (cat) => `${CONTENT_PREFIX}/${property}/${language}/${cat}`
  );
}

function normalizePath(path) {
  let normalized = trimSlashes(path).toLowerCase();

  const segments = normalized.split("/");

  if (segments.length >= 2 && supportedLangs.includes(segments[1])) {
    segments.splice(1, 1);
    normalized = segments.join("/");
  }

  return normalized;
}

function getPathSegment(path) {
  const segments = trimSlashes(path).split("/");
  return segments.at(-1).toLowerCase();
}

export function filterByRequestedPaths(allData, requestedPaths) {
  if (!requestedPaths || requestedPaths.length === 0) {
    return allData;
  }

  const result = [];
  const usedPaths = new Set();

  for (const requestedPath of requestedPaths) {
    const normalizedRequestedPath = normalizePath(requestedPath);
    const requestedSegment = getPathSegment(requestedPath);

    for (const item of allData) {
      if (usedPaths.has(item.path)) continue;

      const itemSegment = getPathSegment(item.path);
      const normalizedItemPath = normalizePath(item.path);

      const exactMatch = normalizedItemPath === normalizedRequestedPath;
      const segmentMatch = itemSegment === requestedSegment;
      const endsWithMatch = normalizedItemPath.endsWith(
        normalizedRequestedPath
      );

      if (exactMatch || segmentMatch || endsWithMatch) {
        result.push(item);
        usedPaths.add(item.path);
        break;
      }
    }
  }

  return result;
}

export function createCardElement(cardData, options = {}) {
  const {
    containerClass = "two-columns-container-card",
    imageLinkClass = "two-columns-container-image-link",
    imageWrapperClass = "two-columns-container-images",
    labelClass = "two-columns-container-label",
    subLinkClass = "two-columns-container-sub-link",
    subDescriptionClass = "two-columns-container-sub-description",
    ctaLinkClass = "two-columns-container-link",
    descriptionClass = "two-columns-container-description",
    descriptionIconClass = "two-columns-container-description-icon",
    contentMainClass = "two-columns-container-content-main",
    leftContainerClass = "two-columns-container-left",
    rightContainerClass = "two-columns-container-right",
    supportingTextClass = "two-columns-container-supporting-text",
  } = options;

  const card = document.createElement("div");
  card.className = containerClass;

  if (cardData.image) {
    const imageLink = document.createElement("a");
    imageLink.href = cardData.path;
    imageLink.className = imageLinkClass;

    const imageWrapper = document.createElement("div");
    imageWrapper.className = imageWrapperClass;

    // Use AEM's createOptimizedPicture with 660px width for both desktop and mobile
    const picture = createOptimizedPicture(
      cardData.image,
      cardData.title || "",
      false, // not eager loading
      [
        { media: "(min-width: 600px)", width: "800" },
        { width: "660" }
      ]
    );

    imageWrapper.appendChild(picture);
    imageLink.appendChild(imageWrapper);
    card.appendChild(imageLink);
  }

  const contentMain = document.createElement("div");
  contentMain.className = contentMainClass;

  const leftContainer = document.createElement("div");
  leftContainer.className = leftContainerClass;

  // Only create label if subTitle exists
  if (cardData.subTitle) {
    const label = document.createElement("div");
    label.className = labelClass;
    label.textContent = cardData.subTitle;
    leftContainer.appendChild(label);
  }

  if (cardData.title && cardData.path) {
    const titleLink = document.createElement("a");
    titleLink.href = cardData.path;
    titleLink.className = subLinkClass;

    const title = document.createElement("p");
    title.className = subDescriptionClass;
    title.textContent = cardData.title;

    titleLink.appendChild(title);
    leftContainer.appendChild(titleLink);
  }

  if (cardData.ctaName && cardData.ctaUrl) {
    const ctaLink = document.createElement("a");
    ctaLink.href = cardData.ctaUrl;
    ctaLink.className = ctaLinkClass;

    const description = document.createElement("div");
    description.className = descriptionClass;
    description.textContent = cardData.ctaName;

    const svg = document.createElement("img");
    svg.src = "/icons/chevron_forward.svg";
    svg.alt = "Arrow";
    svg.className = descriptionIconClass;

    description.appendChild(svg);
    ctaLink.appendChild(description);
    leftContainer.appendChild(ctaLink);
  }

  contentMain.appendChild(leftContainer);

  if (cardData.description) {
    const rightContainer = document.createElement("div");
    rightContainer.className = rightContainerClass;

    const supportingText = document.createElement("div");
    supportingText.className = supportingTextClass;
    supportingText.textContent = cardData.description;

    rightContainer.appendChild(supportingText);
    contentMain.appendChild(rightContainer);
  }

  card.appendChild(contentMain);
  return card;
}

export function setupCardHoverEffects(card, options = {}) {
  if (globalThis.innerWidth < 768) return;

  const {
    imageSelector = ".two-columns-container-images",
    linkSelector = ".two-columns-container-sub-link",
  } = options;

  const imageSection = card.querySelector(imageSelector);
  const subLink = card.querySelector(linkSelector);

  if (imageSection && subLink) {
    imageSection.addEventListener("mouseenter", () => {
      subLink.classList.add("hovered");
    });

    imageSection.addEventListener("mouseleave", () => {
      subLink.classList.remove("hovered");
    });

    subLink.addEventListener("mouseenter", () => {
      imageSection.classList.add("hovered");
    });

    subLink.addEventListener("mouseleave", () => {
      imageSection.classList.remove("hovered");
    });
  }
}
