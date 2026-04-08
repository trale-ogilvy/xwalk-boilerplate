import { moveInstrumentation } from "../../scripts/scripts.js";

export default function decorate(block) {
  const tileContainer = document.createElement("div");
  tileContainer.className = "three-column-tile-wrapper-main";

  const tileWrapper = document.createElement("div");
  tileWrapper.className = "three-column-tile block";
  tileWrapper.dataset.blockName = "three-column-tile";
  tileWrapper.dataset.blockStatus = "loaded";
  tileContainer.appendChild(tileWrapper);

  const columns = Array.from(block.children);

  if (columns.length > 0) {
    const mainTile = createTile(columns[0], "main-tile");
    tileWrapper.appendChild(mainTile);
  }

  if (columns.length > 1) {
    const subTile1 = createTile(columns[1], "sub-tile");
    tileWrapper.appendChild(subTile1);

    if (columns.length > 2) {
      const subTile2 = createTile(columns[2], "sub-tile");
      tileWrapper.appendChild(subTile2);
    }
  }

  block.innerHTML = "";
  block.appendChild(tileContainer);
}

function setupHoverEffects(tile) {
  const imageSection = tile.querySelector(".grid-tile-image");
  const titleSection = tile.querySelector(".grid-tile-title");

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
      if (titleLink && titleLink.href) {
        window.location.href = titleLink.href;
      }
    });
  }
}

function createTile(column, tileClass) {
  const tile = document.createElement("div");
  tile.className = `${tileClass}`;
  moveInstrumentation(column, tile);

  const image = column.querySelector("picture");
  if (image) {
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "grid-tile-image";
    imageWrapper.style.cursor = "pointer"; // Add cursor pointer
    moveInstrumentation(image, imageWrapper);
    imageWrapper.appendChild(image);
    tile.appendChild(imageWrapper);
  }

  const contentContainer = document.createElement("div");
  contentContainer.className = "grid-tile-content";

  const elements = Array.from(column.children).filter(
    (child) => child.tagName !== "PICTURE"
  );

  const contentItems = elements.map((el) => {
    const p = el.querySelector("p");
    return p ? p.textContent.trim() : el.textContent.trim();
  });

  if (contentItems[1]) {
    const category = document.createElement("div");
    category.className = "grid-tile-category";
    category.textContent = contentItems[1];
    moveInstrumentation(elements[1], category);
    contentContainer.appendChild(category);
  }

  if (contentItems[3]) {
    const titleWrapper = document.createElement("a");
    const titleElement = elements[3].querySelector("p");
    const linkElement = elements[2].querySelector("a");

    if (linkElement && titleElement) {
      const url = new URL(linkElement.href);
      titleWrapper.href = url.pathname;
      titleWrapper.className = linkElement.className;
      moveInstrumentation(linkElement, titleWrapper);
      titleWrapper.appendChild(titleElement.cloneNode(true));
      const title = document.createElement("div");
      title.className = "grid-tile-title";
      title.appendChild(titleWrapper);
      contentContainer.appendChild(title);
    }
  }

  if (contentContainer.children.length > 0) {
    tile.appendChild(contentContainer);
  }

  // Setup hover effects for this tile
  setupHoverEffects(tile);

  return tile;
}
