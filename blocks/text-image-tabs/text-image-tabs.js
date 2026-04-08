/**
 * Creates the category filter navigation with a sliding effect.
 * @param {string[]} categories - An array of category names.
 * @returns {HTMLElement} The fully constructed filters container.
 */

function createCategoryFilters(categories) {
  const wrapper = document.createElement("div");
  wrapper.className = "category-tabs-wrapper";

  const tabs = document.createElement("div");
  tabs.className = "category-tabs";

  const slider = document.createElement("div");
  slider.className = "category-slider";
  slider.style.cssText =
    "transition: left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);";

  const updateSliderPosition = () => {
    const activeTab = tabs.querySelector(".category-tab.active");
    if (activeTab) {
      const tabWidth = activeTab.offsetWidth;
      const tabLeft = activeTab.offsetLeft;

      slider.style.left = `${tabLeft}px`;
      slider.style.width = `${tabWidth}px`;
    }
  };

  const setEqualTabWidths = () => {
    const tabButtons = tabs.querySelectorAll(".category-tab");
    if (!tabButtons.length) return;

    tabButtons.forEach((tab) => {
      tab.style.width = "auto";
    });

    let maxWidth = 0;
    tabButtons.forEach((tab) => {
      if (tab.offsetWidth > maxWidth) {
        maxWidth = tab.offsetWidth;
      }
    });

    if (maxWidth > 0) {
      tabButtons.forEach((tab) => {
        tab.style.width = `${maxWidth}px`;
      });
    }
  };

  // Create tab buttons
  categories.forEach((category, idx) => {
    const button = document.createElement("button");
    button.className = `category-tab text-b text-text-white${
      idx === 0 ? " active" : ""
    }`;
    button.dataset.category = category;
    button.textContent = category.toUpperCase();

    button.addEventListener("click", () => {
      tabs.querySelectorAll(".category-tab").forEach((tab) => {
        tab.classList.remove("active");
      });

      button.classList.add("active");

      updateSliderPosition();

      document.querySelectorAll(".text-image-feed").forEach((feed) => {
        if (feed.dataset.category === category.toLowerCase()) {
          feed.style.display = "flex";
        } else {
          feed.style.display = "none";
        }
      });
    });

    tabs.appendChild(button);
  });

  tabs.appendChild(slider);
  wrapper.appendChild(tabs);

  // Add scroll overlays functionality
  function addScrollOverlays() {
    const leftOverlay = document.createElement("div");
    leftOverlay.className = "category-tabs-scroll-overlay left";
    leftOverlay.style.display = "none";
    leftOverlay.style.opacity = "0";
    leftOverlay.style.transition = "opacity 0.4s";
    wrapper.appendChild(leftOverlay);

    const rightOverlay = document.createElement("div");
    rightOverlay.className = "category-tabs-scroll-overlay right";
    rightOverlay.style.display = "none";
    rightOverlay.style.opacity = "0";
    rightOverlay.style.transition = "opacity 0.4s";
    wrapper.appendChild(rightOverlay);

    function updateOverlays() {
      const scrollLeft = tabs.scrollLeft;
      const maxScrollLeft = tabs.scrollWidth - tabs.clientWidth;

      const epsilon = 8;

      if (scrollLeft > epsilon) {
        leftOverlay.style.display = "block";
        leftOverlay.style.opacity = "1";
      } else {
        leftOverlay.style.opacity = "0";
        setTimeout(() => {
          if (tabs.scrollLeft <= epsilon) {
            leftOverlay.style.display = "none";
          }
        }, 400);
      }

      if (scrollLeft < maxScrollLeft - epsilon) {
        rightOverlay.style.display = "block";
        rightOverlay.style.opacity = "1";
      } else {
        rightOverlay.style.opacity = "0";
        setTimeout(() => {
          if (tabs.scrollLeft >= maxScrollLeft - epsilon) {
            rightOverlay.style.display = "none";
          }
        }, 400);
      }
    }

    tabs.addEventListener("scroll", updateOverlays);
    window.addEventListener("resize", updateOverlays);

    setTimeout(updateOverlays, 10);
  }

  const handleResize = () => {
    setEqualTabWidths();
    setTimeout(updateSliderPosition, 10);
  };

  setTimeout(() => {
    setEqualTabWidths();
    updateSliderPosition();
    addScrollOverlays();
    window.addEventListener("resize", handleResize);
  }, 100);

  return wrapper;
}

/**
 * Decorates a single feed item within the tabs container.
 * @param {HTMLElement} itemBlock
 */
function decorateFeedItem(itemBlock) {
  const textCol = document.createElement("div");
  textCol.className = "text-image-feed__text-column";

  const imageCol = document.createElement("div");
  imageCol.className = "text-image-feed__image-column";

  const rows = [...itemBlock.children];

  const categoryRow = rows.shift();
  const titleRow = rows.shift();
  const descRow = rows.shift();
  const imageRow = rows.shift();
  const positionRow = rows.shift();

  if (categoryRow?.textContent.trim()) {
    itemBlock.dataset.category = categoryRow.textContent.trim().toLowerCase();
  }

  let imageRight = false;
  if (positionRow && positionRow.textContent.trim().toLowerCase() === "right") {
    imageRight = true;
  }

  let title =
    titleRow?.textContent
      .trim()
      .replace(/&amp;nbsp;/g, " ")
      .replace(/&lt;\/?p&gt;/g, "") || "";

  let descriptionContent =
    descRow?.querySelector("div")?.cloneNode(true) || descRow?.cloneNode(true);

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "text-image-feed__content-wrapper";

  if (title) {
    const titleEl = document.createElement("div");
    titleEl.className = "text-image-feed__title text-t5";
    titleEl.textContent = title;
    textCol.append(titleEl);
  }

  if (descriptionContent) {
    const descEl = document.createElement("div");
    descEl.className = "text-image-feed__description text-p1";
    while (descriptionContent.firstChild) {
      descEl.appendChild(descriptionContent.firstChild);
    }
    contentWrapper.append(descEl);
  }

  if (imageRow && imageRow.querySelector("picture")) {
    imageCol.append(imageRow.querySelector("picture").cloneNode(true));
  }

  const buttonRows = rows;
  const buttonData = [];

  for (let i = 0; i < buttonRows.length; i += 2) {
    const textCell = buttonRows[i]?.firstElementChild;
    const linkCell = buttonRows[i + 1]?.firstElementChild;

    if (textCell?.textContent.trim() && linkCell?.querySelector("a.button")) {
      buttonData.push({
        text: textCell.textContent.trim(),
        link: linkCell.querySelector("a.button"),
      });
    }
  }

  if (buttonData.length > 0) {
    const buttonsWrapper = document.createElement("div");
    buttonsWrapper.className = "text-image-feed__buttons-wrapper";

    buttonData.forEach((data, index) => {
      const newButton = data.link.cloneNode(true);
      newButton.innerHTML = "";
      newButton.classList.add("button-styled");

      const textSpan = document.createElement("span");
      const textElement = document.createElement("p");
      textElement.className = "text-b";
      textElement.textContent = data.text;
      textSpan.appendChild(textElement);
      newButton.append(textSpan);

      if (buttonData.length === 1) {
        const icon = document.createElement("div");
        icon.className = "button-icon";
        icon.setAttribute("aria-hidden", "true");
        newButton.append(icon);
      }

      buttonsWrapper.append(newButton);

      if (buttonData.length === 2 && index === 0) {
        const separator = document.createElement("div");
        separator.className = "button-separator";
        buttonsWrapper.append(separator);
      }
    });
    contentWrapper.append(buttonsWrapper);
  }

  textCol.append(contentWrapper);
  itemBlock.innerHTML = "";

  if (imageRight) {
    itemBlock.classList.add("image-right");
  }

  itemBlock.append(imageCol, textCol);
}

/**
 * Main function to decorate the tabs container block.
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const containerRow = rows.shift();
  const feedItems = rows;

  const categories =
    containerRow?.textContent
      .trim()
      .split(",")
      .map((cat) => cat.trim())
      .filter(Boolean) || [];

  block.innerHTML = "";

  if (categories && categories.length > 0) {
    const filtersContainer = createCategoryFilters(categories);
    block.appendChild(filtersContainer);
  }

  const feedsContainer = document.createElement("div");
  feedsContainer.className = "text-image-tabs__feeds-container";

  feedItems.forEach((item) => {
    item.classList.add("text-image-feed");
    decorateFeedItem(item);

    if (categories && categories.length > 0) {
      const firstCategory = categories[0].toLowerCase();
      if (item.dataset.category !== firstCategory) {
        item.style.display = "none";
      }
    }

    feedsContainer.appendChild(item);
  });

  block.appendChild(feedsContainer);
}
