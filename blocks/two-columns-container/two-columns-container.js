import { createTypesFilter } from "./types-filter.js";
import { isUniversalEditor } from "../../scripts/aem.js";
import {
  handleAuthoringContentChange,
  fetchPlaceholders,
} from "../../scripts/utils.js";

let placeholders = {};

async function initializePlaceholders() {
  if (Object.keys(placeholders).length === 0) {
    placeholders = await fetchPlaceholders();
  }
  return placeholders;
}

export default async function decorate(block) {
  await initializePlaceholders();

  const typeDefaultLabel = placeholders.offerType || "All Types";
  const destinationDefaultLabel =
    placeholders.offerDestination || "All Destinations";

  block.classList.add("two-columns-container-col");

  const existingFilterWrapper = block.parentNode.querySelector(
    ".two-columns-container-filter-wrapper"
  );
  const filterWrapper = existingFilterWrapper || document.createElement("div");
  filterWrapper.className = "two-columns-container-filter-wrapper";

  if (!existingFilterWrapper) {
    block.parentNode.insertBefore(filterWrapper, block);
  }

  if (isUniversalEditor()) {
    filterWrapper.style.display = "none";

    handleAuthoringContentChange("main", () => {
      const updatedFilterWrapper = block.parentNode.querySelector(
        ".two-columns-container-filter-wrapper"
      );
      if (updatedFilterWrapper) {
        updatedFilterWrapper.style.display = "none";
      }
    });
  }

  const existingFilterRow = filterWrapper.querySelector(
    ".two-columns-container-filter-row"
  );
  if (existingFilterRow) {
    existingFilterRow.remove();
  }

  const children = Array.from(block.children);

  const filterState = {
    type: typeDefaultLabel.toLowerCase(),
    destination: destinationDefaultLabel.toLowerCase(),
  };

  const hasDestinationContent =
    children[0] && children[0].textContent.trim().length > 0;
  const hasTypeContent =
    children[1] && children[1].textContent.trim().length > 0;
  const hasFilterContent = hasDestinationContent || hasTypeContent;
  const shouldShowFilters = hasFilterContent || !isUniversalEditor();

  if (hasFilterContent && shouldShowFilters) {
    const filterRow = document.createElement("div");
    filterRow.className = "two-columns-container-filter-row";
    filterWrapper.appendChild(filterRow);

    let destinationValues = [];
    let typeValues = [];

    if (hasDestinationContent) {
      destinationValues = children[0].textContent
        .trim()
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0);
    }
    if (children.length > 0) children[0].remove();

    if (hasTypeContent) {
      typeValues = children[1].textContent
        .trim()
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0);
    }
    if (children.length > 1) children[1].remove();

    if (children.length > 2 && !children[2].textContent.trim()) {
      children[2].remove();
    }

    if (destinationValues.length > 0) {
      const destinationFilter = createTypesFilter({
        allTypes: destinationValues,
        defaultLabel: destinationDefaultLabel,
        activeType: destinationDefaultLabel,
        onFilterChange: (selectedDestination) => {
          filterState.destination = selectedDestination.toLowerCase();
          applyFilters();
        },
      });
      destinationFilter.classList.add("destination-filter");
      filterRow.appendChild(destinationFilter);
    }

    if (typeValues.length > 0) {
      const typeFilter = createTypesFilter({
        allTypes: typeValues,
        defaultLabel: typeDefaultLabel,
        activeType: typeDefaultLabel,
        onFilterChange: (selectedType) => {
          filterState.type = selectedType.toLowerCase();
          applyFilters();
        },
      });
      typeFilter.classList.add("type-filter");
      filterRow.appendChild(typeFilter);
    }

    if (destinationValues.length === 0 && typeValues.length === 0) {
      filterWrapper.style.display = "none";
    }
  } else {
    if (isUniversalEditor() && !hasFilterContent) {
      filterWrapper.style.display = "none";
    }

    if (children.length > 0) children[0].remove();
    if (children.length > 1) children[1].remove();
    if (children.length > 2 && !children[2].textContent.trim())
      children[2].remove();
  }

  const cards = Array.from(block.children);
  let processedCards = [];

  cards.forEach((row, index) => {
    const hasContent =
      row.textContent.trim() !== "" || row.querySelector("picture");
    if (!hasContent) return;

    processCard(row, index);
    processedCards.push(row);
  });

  function applyFilters() {
    processedCards.forEach((card) => {
      const cardDestination = card.dataset.destination?.toLowerCase() || "";
      const cardType = card.dataset.type?.toLowerCase() || "";

      const hasDestinationFilter = filterWrapper.querySelector(
        ".destination-filter"
      );
      const hasTypeFilter = filterWrapper.querySelector(".type-filter");

      let typeMatch = true;
      let destinationMatch = true;

      if (hasTypeFilter) {
        typeMatch =
          filterState.type === typeDefaultLabel.toLowerCase() ||
          cardType === filterState.type;
      }

      if (hasDestinationFilter) {
        destinationMatch =
          filterState.destination === destinationDefaultLabel.toLowerCase() ||
          cardDestination === filterState.destination;
      }

      card.style.display = typeMatch && destinationMatch ? "" : "none";
    });
  }

  applyFilters();

  function setupHoverEffects(row) {
    if (window.innerWidth < 768) return;
    const imagesSection = row.querySelector(".two-columns-container-images");
    const subLink = row.querySelector(".two-columns-container-sub-link");

    if (imagesSection && subLink) {
      // Desktop hover behavior
      imagesSection.addEventListener("mouseenter", () => {
        subLink.classList.add("hovered");
      });

      imagesSection.addEventListener("mouseleave", () => {
        subLink.classList.remove("hovered");
      });

      subLink.addEventListener("mouseenter", () => {
        imagesSection.classList.add("hovered");
      });

      subLink.addEventListener("mouseleave", () => {
        imagesSection.classList.remove("hovered");
      });
    }
  }

  function processCard(row, index) {
    row.classList.add("two-columns-container-card");
    row.dataset.value = `card-${index + 1}`;

    const cardDivs = Array.from(row.children);

    const valueDivs = cardDivs.slice(-2);

    if (valueDivs.length >= 2) {
      row.dataset.destination =
        valueDivs[0]?.textContent.trim().toLowerCase() || "";
      row.dataset.type = valueDivs[1]?.textContent.trim().toLowerCase() || "";

      valueDivs.forEach((div) => div.remove());
    }

    const cardSections = Array.from(row.children);
    const needsContentMain = cardSections.some((_, i) => i > 0 && i < 8);
    let contentMain, leftContainer, rightContainer;

    if (needsContentMain) {
      contentMain = document.createElement("div");
      contentMain.className = "two-columns-container-content-main";

      const hasLeftContent = cardSections.some((_, i) => i >= 1 && i <= 5);
      const hasRightContent = cardSections.some((_, i) => i >= 6 && i <= 12);

      if (hasLeftContent) {
        leftContainer = document.createElement("div");
        leftContainer.className = "two-columns-container-left";
        contentMain.appendChild(leftContainer);
      }

      if (hasRightContent) {
        rightContainer = document.createElement("div");
        rightContainer.className = "two-columns-container-right";
        contentMain.appendChild(rightContainer);
      }
    }

    cardSections.forEach((section, sectionIndex) => {
      if (
        !section ||
        (!section.textContent.trim() && !section.querySelector("picture, a"))
      ) {
        section?.remove();
        return;
      }

      switch (sectionIndex) {
        case 0:
          if (section.querySelector("picture")) {
            const img = section.querySelector("picture img");
            if (img) {
              img.classList.add("lazy");
            }
            section.classList.add("two-columns-container-images");
            const imagesSection = section;
            if (contentMain) {
              row.insertBefore(contentMain, section.nextSibling);
            }
            row._imagesSection = imagesSection;
          }
          break;

        case 1:
          if (leftContainer && section.textContent.trim()) {
            section.classList.add("two-columns-container-label");
            leftContainer.appendChild(section);
          }
          break;

        case 2: {
          const link = section.querySelector("a");
          if (!link) {
            if (leftContainer && section.textContent.trim()) {
              leftContainer.appendChild(section);
            }
            break;
          }

          const nextSection = cardSections[3];
          const hasDescription = nextSection?.textContent.trim();

          if (hasDescription) {
            const secondaryLink = document.createElement("a");
            secondaryLink.href = link.getAttribute("href") || "#";
            secondaryLink.className = "two-columns-container-sub-link";

            const subDescription = document.createElement("p");
            subDescription.className = "two-columns-container-sub-description";
            subDescription.textContent = nextSection.textContent.trim();
            secondaryLink.appendChild(subDescription);

            section.replaceWith(secondaryLink);
            nextSection.remove();
            cardSections[3] = null;

            if (leftContainer) leftContainer.appendChild(secondaryLink);
            if (row._imagesSection) {
              const imageLink = document.createElement("a");
              imageLink.href = secondaryLink.href;
              imageLink.className = "two-columns-container-image-link";

              // Wrap the image section with the link
              row._imagesSection.parentNode.insertBefore(
                imageLink,
                row._imagesSection
              );
              imageLink.appendChild(row._imagesSection);
            }
          } else if (leftContainer) {
            section.classList.add("two-columns-container-sub-link");
            link.classList.add("two-columns-container-sub-link");
            leftContainer.appendChild(section);

            if (row._imagesSection) {
              const imageLink = document.createElement("a");
              imageLink.href = link.getAttribute("href") || "#";
              imageLink.className = "two-columns-container-image-link";

              // Wrap the image section with the link
              row._imagesSection.parentNode.insertBefore(
                imageLink,
                row._imagesSection
              );
              imageLink.appendChild(row._imagesSection);
            }
          }
          break;
        }

        case 3:
          if (section && leftContainer && section.textContent.trim()) {
            section.classList.add("two-columns-container-sub-description");
            leftContainer.appendChild(section);
          }
          break;

        case 4: {
          const link = section.querySelector("a");
          if (!link) {
            if (leftContainer && section.textContent.trim()) {
              leftContainer.appendChild(section);
            }
            break;
          }

          const nextSection = cardSections[5];
          const hasDescription = nextSection?.textContent.trim();

          if (hasDescription) {
            const contentLink = document.createElement("a");
            contentLink.href = link.getAttribute("href") || "#";
            contentLink.className = "two-columns-container-link";

            const description = document.createElement("div");
            description.className = "two-columns-container-description";
            description.textContent = nextSection.textContent.trim();

            const svg = document.createElement("img");
            svg.src = "/icons/chevron_forward.svg";
            svg.alt = "Arrow";
            svg.className = "two-columns-container-description-icon";
            description.appendChild(svg);

            contentLink.appendChild(description);
            section.replaceWith(contentLink);
            nextSection.remove();
            cardSections[5] = null;

            if (leftContainer) leftContainer.appendChild(contentLink);
          } else if (leftContainer) {
            section.classList.add("two-columns-container-link");
            link.classList.add("two-columns-container-link");
            leftContainer.appendChild(section);
          }
          break;
        }

        case 5:
          if (section && leftContainer && section.textContent.trim()) {
            section.classList.add("two-columns-container-description");

            if (
              !section.querySelector(".two-columns-container-description-icon")
            ) {
              const svg = document.createElement("img");
              svg.src = "/icons/chevron_forward.svg";
              svg.alt = "Arrow";
              svg.className = "two-columns-container-description-icon";
              section.appendChild(svg);
            }

            leftContainer.appendChild(section);
          }
          break;

        case 6:
          if (rightContainer && section.textContent.trim()) {
            section.classList.add("two-columns-container-supporting-text");
            rightContainer.appendChild(section);
          }
          break;

        default:
          if (sectionIndex >= 7) {
            if (sectionIndex % 2 === 1) {
              const iconSection = section;
              const textSection = cardSections[sectionIndex + 1];

              if (
                iconSection &&
                iconSection.querySelector("picture") &&
                textSection &&
                textSection.textContent.trim()
              ) {
                let featuresContainer = rightContainer.querySelector(
                  ".two-columns-container-features"
                );
                if (!featuresContainer) {
                  featuresContainer = document.createElement("div");
                  featuresContainer.className =
                    "two-columns-container-features";
                  rightContainer.appendChild(featuresContainer);
                }

                const featureDiv = document.createElement("div");
                featureDiv.className = "two-columns-container-feature";

                iconSection.classList.add("two-columns-container-feature-icon");
                featureDiv.appendChild(iconSection);

                textSection.classList.add("two-columns-container-feature-text");
                featureDiv.appendChild(textSection);

                featuresContainer.appendChild(featureDiv);
              }
            }
          }
          break;
      }
    });

    setupHoverEffects(row);
  }
}
