import { getBasePathBasedOnEnv } from "../../scripts/utils.js";
import {
  supportedSites,
  VALID_CATEGORIES,
  supportedLangs,
} from "../../constants.js";

const CONTENT_PREFIX = "/content/patina";

export function parseUserPath(userPath) {
  let cleanPath = userPath.trim();

  while (cleanPath.startsWith("/")) {
    cleanPath = cleanPath.substring(1);
  }

  while (cleanPath.endsWith("/")) {
    cleanPath = cleanPath.slice(0, -1);
  }

  const segments = cleanPath.split("/");
  const hasSpecificItem = segments.length > 3;

  const parentPath = hasSpecificItem
    ? segments.slice(0, 3).join("/")
    : segments.join("/");
  const specificItem = hasSpecificItem ? segments.slice(3).join("/") : null;

  return {
    apiPath: `${CONTENT_PREFIX}/${parentPath}`,
    parentPath: `/${parentPath}`,
    specificItem,
  };
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
    console.error("Failed to fetch card data:", error);
    return [];
  }
}

export function getPropertyAndLanguageFromUrl() {
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split("/").filter(Boolean);

  if (pathSegments.length === 0) return null;

  const property = pathSegments[0];
  if (!supportedSites.includes(property)) return null;

  const language = getLanguageFromSegments(pathSegments);
  return { property, language };
}

function getLanguageFromSegments(pathSegments) {
  return pathSegments.length >= 2 && supportedLangs.includes(pathSegments[1])
    ? pathSegments[1]
    : "en";
}

function isValidCategoryPath(pathSegments) {
  return (
    pathSegments.length >= 2 &&
    pathSegments[1].length === 2 &&
    pathSegments[1] !== "en"
  );
}

function getCategoryIndex(pathSegments) {
  return pathSegments[1] === "en" ? 2 : 1;
}

function validateCategory(property, category) {
  if (!supportedSites.includes(property)) return false;

  const validCategoriesForProperty = VALID_CATEGORIES[property];
  return validCategoriesForProperty?.includes(category) ?? false;
}

export function getCurrentPageCategory() {
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split("/").filter(Boolean);

  if (isValidCategoryPath(pathSegments)) return null;

  const categoryIndex = getCategoryIndex(pathSegments);
  if (pathSegments.length <= categoryIndex) return null;

  const property = pathSegments[0];
  const category = pathSegments[categoryIndex];

  if (!validateCategory(property, category)) return null;

  const parentPath = `/${property}/en/${category}`;
  const apiPath = `${CONTENT_PREFIX}${parentPath}`;

  return {
    apiPath,
    parentPath: parentPath.replace("/en/", "/"),
    category,
    property,
    isAutoDetected: true,
  };
}

export function findMatchingCard(allData, parentPath, specificItem) {
  const normalizedParent = parentPath.replace("/en/", "/");
  const matchingParent = allData.filter((item) =>
    item.path?.startsWith(normalizedParent)
  );

  if (matchingParent.length === 0) return null;
  if (!specificItem) return matchingParent[0];

  const specificCard = findSpecificCard(
    matchingParent,
    normalizedParent,
    specificItem
  );
  return specificCard || matchingParent[0];
}

function findSpecificCard(matchingParent, normalizedParent, specificItem) {
  return matchingParent.find(
    (item) =>
      item.path === `${normalizedParent}/${specificItem}` ||
      item.path?.endsWith(`/${specificItem}`)
  );
}

function createCategoryMap(allData, usedCards) {
  const categoryMap = {};
  allData.forEach((item) => {
    if (usedCards.has(item.path)) return;
    const cat = item.category || "Other";
    categoryMap[cat] = categoryMap[cat] || [];
    categoryMap[cat].push(item);
  });
  return categoryMap;
}

function processParsedPaths(selected, usedCards, allData, parsedPaths, count) {
  for (const { parentPath, specificItem } of parsedPaths) {
    if (selected.length >= count) break;
    const card = findMatchingCard(allData, parentPath, specificItem);
    if (card && !usedCards.has(card.path)) {
      selected.push(card);
      usedCards.add(card.path);
    }
  }
}

function selectFromUnusedCategories(
  selected,
  categoryMap,
  usedCards,
  usedCategories,
  count
) {
  const categories = Object.keys(categoryMap);

  for (const category of categories) {
    if (selected.length >= count) break;
    if (usedCategories.has(category)) continue;

    const items = categoryMap[category];
    if (items.length > 0) {
      selected.push(items[0]);
      usedCards.add(items[0].path);
      usedCategories.add(category);
    }
  }
}

function selectFromAllCategories(selected, categoryMap, usedCards, count) {
  const categories = Object.keys(categoryMap);

  for (const category of categories) {
    const items = categoryMap[category];
    for (const item of items) {
      if (selected.length >= count) break;
      if (!usedCards.has(item.path)) {
        selected.push(item);
        usedCards.add(item.path);
      }
    }
    if (selected.length >= count) break;
  }
}

export function selectCards(allData, parsedPaths, count = 3) {
  if (!allData?.length) return [];

  const selected = [];
  const usedCards = new Set();

  processParsedPaths(selected, usedCards, allData, parsedPaths, count);

  if (selected.length < count) {
    const categoryMap = createCategoryMap(allData, usedCards);
    const usedCategories = new Set(selected.map((s) => s.category));

    selectFromUnusedCategories(
      selected,
      categoryMap,
      usedCards,
      usedCategories,
      count
    );

    if (selected.length < count) {
      selectFromAllCategories(selected, categoryMap, usedCards, count);
    }
  }

  return selected.slice(0, count);
}

function sortCategoriesByRemainingItems(
  categories,
  categoryMap,
  usedCategories
) {
  return categories.toSorted((a, b) => {
    const aRemaining = categoryMap[a].length - (usedCategories.has(a) ? 1 : 0);
    const bRemaining = categoryMap[b].length - (usedCategories.has(b) ? 1 : 0);
    return bRemaining - aRemaining;
  });
}

function selectInitialCards(
  selected,
  availableCategories,
  categoryMap,
  usedCategories,
  count
) {
  for (const category of availableCategories) {
    if (selected.length >= count) break;
    const items = categoryMap[category];
    if (items.length > 0) {
      selected.push(items[0]);
      usedCategories.add(category);
    }
  }
}

function selectAdditionalCards(
  selected,
  availableCategories,
  categoryMap,
  usedCategories,
  count
) {
  const categoriesByCount = sortCategoriesByRemainingItems(
    availableCategories,
    categoryMap,
    usedCategories
  );

  for (const category of categoriesByCount) {
    const items = categoryMap[category];
    const startIndex = usedCategories.has(category) ? 1 : 0;

    for (let i = startIndex; i < items.length && selected.length < count; i++) {
      selected.push(items[i]);
    }
    if (selected.length >= count) break;
  }
}

export function selectCardsWithCategoryDiversity(
  allData,
  currentCategory,
  count = 3
) {
  if (!allData?.length) return [];

  const categoryMap = createCategoryMap(allData, new Set());
  const categories = Object.keys(categoryMap);

  const availableCategories = currentCategory
    ? categories.filter(
        (cat) => cat.toLowerCase() !== currentCategory.toLowerCase()
      )
    : categories;

  const selected = [];
  const usedCategories = new Set();

  selectInitialCards(
    selected,
    availableCategories,
    categoryMap,
    usedCategories,
    count
  );

  if (selected.length < count) {
    selectAdditionalCards(
      selected,
      availableCategories,
      categoryMap,
      usedCategories,
      count
    );
  }

  return selected.slice(0, count);
}

export function getAllCategoriesForProperty(property, language) {
  const allCategories = VALID_CATEGORIES[property];
  return (
    allCategories?.map(
      (cat) => `${CONTENT_PREFIX}/${property}/${language}/${cat}`
    ) || []
  );
}

export function setupHoverEffects(tile) {
  const imageSection = tile.querySelector(".xsell-tile-image");
  const titleSection = tile.querySelector(".xsell-tile-title");

  if (imageSection && titleSection) {
    imageSection.addEventListener("mouseenter", () => {
      titleSection.classList.add("hovered");
    });

    imageSection.addEventListener("mouseleave", () => {
      titleSection.classList.remove("hovered");
    });

    titleSection.addEventListener("mouseenter", () => {
      imageSection.classList.add("hovered");
    });

    titleSection.addEventListener("mouseleave", () => {
      imageSection.classList.remove("hovered");
    });

    imageSection.addEventListener("click", (e) => {
      e.preventDefault();
      const titleLink = titleSection.querySelector("a");
      if (titleLink?.href) {
        window.location.href = titleLink.href;
      }
    });
  }
}

export function createTile(cardData, tileClass, pictureCreator) {
  const tile = document.createElement("div");
  tile.className = tileClass;

  // Create image section
  if (cardData.image) {
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "xsell-tile-image";
    imageWrapper.style.cursor = "pointer";

    const optimizedPicture = pictureCreator(
      cardData.image,
      cardData.title || "",
      false,
      [{ media: "(min-width: 600px)", width: "1000" }, { width: "750" }]
    );
    imageWrapper.appendChild(optimizedPicture);
    tile.appendChild(imageWrapper);
  }

  const contentContainer = document.createElement("div");
  contentContainer.className = "xsell-tile-content";

  if (cardData.category) {
    const category = document.createElement("div");
    category.className = "xsell-tile-category";
    category.textContent = cardData.category;
    contentContainer.appendChild(category);
  }

  if (cardData.title && cardData.path) {
    const titleWrapper = document.createElement("a");
    titleWrapper.href = cardData.path;
    titleWrapper.className = "xsell-tile-link";

    const titleElement = document.createElement("p");
    titleElement.textContent = cardData.title;
    titleWrapper.appendChild(titleElement);

    const title = document.createElement("div");
    title.className = "xsell-tile-title";
    title.appendChild(titleWrapper);
    contentContainer.appendChild(title);
  }

  if (contentContainer.children.length > 0) {
    tile.appendChild(contentContainer);
  }

  setupHoverEffects(tile);
  return tile;
}
