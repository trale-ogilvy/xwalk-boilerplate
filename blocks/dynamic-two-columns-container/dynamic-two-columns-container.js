import { fetchPlaceholders } from "../../scripts/utils.js";

import {
  parseUserPath,
  fetchCardData,
  getPropertyAndLanguageFromUrl,
  getAllCategoriesForProperty,
  filterByRequestedPaths,
  createCardElement,
  setupCardHoverEffects,
} from "./dynamic-two-columns-container-util.js";

let placeholders = {};

async function initializePlaceholders() {
  if (Object.keys(placeholders).length === 0) {
    placeholders = await fetchPlaceholders();
  }
  return placeholders;
}

function extractRequestedPaths(block) {
  const requestedPaths = [];

  for (const row of Array.from(block.children)) {
    const cell = row.querySelector("div");
    if (cell) {
      const userPath = cell.textContent.trim();
      if (userPath) requestedPaths.push(userPath);
    }
  }

  return requestedPaths;
}

function displayMessage(block, message) {
  block.innerHTML = `<p>${message}</p>`;
}

export default async function decorate(block) {
  await initializePlaceholders();
  block.classList.add("two-columns-container-col");

  const requestedPaths = extractRequestedPaths(block);
  let apiPaths = [];

  if (requestedPaths.length > 0) {
    const categoryPaths = new Set(
      requestedPaths.map((path) => parseUserPath(path))
    );
    apiPaths = Array.from(categoryPaths);
  } else {
    const detectedInfo = getPropertyAndLanguageFromUrl();

    if (detectedInfo) {
      const { property, language } = detectedInfo;
      apiPaths = getAllCategoriesForProperty(property, language);
    } else {
      return;
    }
  }

  if (apiPaths.length === 0) {
    return displayMessage(block, "No data available");
  }

  const allData = await fetchCardData(apiPaths);
  if (allData.length === 0) {
    return displayMessage(block, "No data returned from API");
  }

  const displayData =
    requestedPaths.length > 0
      ? filterByRequestedPaths(allData, requestedPaths)
      : allData;

  if (displayData.length === 0) {
    return displayMessage(block, "No matching items found");
  }

  for (const cardData of displayData) {
    const cardElement = createCardElement(cardData);
    setupCardHoverEffects(cardElement);
    block.appendChild(cardElement);
  }
}
