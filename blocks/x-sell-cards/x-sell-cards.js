import { moveInstrumentation } from "../../scripts/scripts.js";
import { createOptimizedPicture } from "../../scripts/aem.js";
import {
  parseUserPath,
  fetchCardData,
  getPropertyAndLanguageFromUrl,
  getCurrentPageCategory,
  selectCards,
  selectCardsWithCategoryDiversity,
  getAllCategoriesForProperty,
  createTile,
} from "./x-sell-cards-util.js";

export default async function decorate(block) {
  const rows = Array.from(block.children);
  const userPaths = [];
  const parsedPaths = [];

  rows.forEach((row) => {
    const cell = row.querySelector("div");
    if (cell) {
      const userPath = cell.textContent.trim();
      if (userPath) {
        const parsed = parseUserPath(userPath);
        userPaths.push(parsed.apiPath);
        parsedPaths.push(parsed);
      }
    }
  });

  // If no paths configured, try to auto-detect from URL
  let autoDetectedCategory = null;
  let detectedInfo = null;

  if (userPaths.length === 0) {
    detectedInfo = getPropertyAndLanguageFromUrl();

    if (!detectedInfo) {
      block.innerHTML = "<p>No paths configured for x-sell cards</p>";
      return;
    }

    const { property, language } = detectedInfo;
    const autoDetected = getCurrentPageCategory();

    if (autoDetected?.category) {
      autoDetectedCategory = autoDetected.category;
    }

    const categoryPaths = getAllCategoriesForProperty(property, language);
    if (categoryPaths.length > 0) {
      userPaths.push(...categoryPaths);
    } else {
      block.innerHTML = "<p>No categories configured for this property</p>";
      return;
    }
  }

  const uniqueApiPaths = [...new Set(userPaths)];
  const allData = await fetchCardData(uniqueApiPaths);

  if (allData.length === 0) {
    block.innerHTML = "<p>No data available</p>";
    return;
  }

  const selectedCards =
    autoDetectedCategory || parsedPaths.length === 0
      ? selectCardsWithCategoryDiversity(allData, autoDetectedCategory, 3)
      : selectCards(allData, parsedPaths, 3);

  const tileWrapper = document.createElement("div");
  tileWrapper.className = "xsell-tile";
  moveInstrumentation(block, tileWrapper);

  // Create tiles based on number of cards
  selectedCards.forEach((card, index) => {
    const tileClass = index === 0 ? "xsell-main-tile" : "xsell-sub-tile";
    const tile = createTile(card, tileClass, createOptimizedPicture);
    tileWrapper.appendChild(tile);
  });

  block.innerHTML = "";
  block.appendChild(tileWrapper);
}
