import {
  createCategoryTabs,
  createMobileCategoryFilter,
  handleMediaBlocks,
} from "../../scripts/utils.js";
import {
  createCarouselModal,
  parseModalSlide,
} from "../../scripts/carousel-modal-utils.js";
import {
  fadeIn,
  fadeOut,
  handleEditorEnv,
} from "./category-tabs-gallery-utils.js";
import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";

let category = "all"; // Default category
let cache;

function gallery() {
  if (isUniversalEditor()) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/category-tabs-gallery/category-tabs-gallery-author.css`
    );
    handleEditorEnv();
    return;
  }

  const mainContainer = document.querySelector(
    ".category-tabs-gallery-container"
  );
  const galleryItems = mainContainer.querySelectorAll(
    ".category-tabs-gallery-wrapper"
  );

  const galleryItemsContainer = document.createElement("section");
  galleryItems.forEach((item) => {
    galleryItemsContainer.appendChild(item);
  });
  galleryItemsContainer.className = "gallery-content-container";

  function renderGalleryItems(currentCategory) {
    //TODO Use cache. Applying this, will affect the modal. To fix
    // if (cache) {
    //   if (!cache._children) {
    //     cache._children = Array.from(cache.children).map((child) =>
    //       child.cloneNode(true)
    //     );
    //   }
    //   const filteredChildren = cache._children.filter((child) => {
    //     const itemCategory = child.getAttribute("data-category");
    //     return currentCategory === "all" || currentCategory === itemCategory;
    //   });
    //   const section = document.querySelector(".grid-view");
    //   section.innerHTML = "";
    //   filteredChildren.forEach((child) => {
    //     section.appendChild(child.cloneNode(true));
    //   });
    //   return;
    // }

    // Clear previous content before rendering new items
    gridSection.innerHTML = "";
    modals.length = 0;
    const filteredModals = [];

    galleryItems.forEach((item, idx) => {
      const rows = [...item.children[0].children];
      const mainContent = rows.slice(0, 7);
      const slidesContent = rows.slice(7);

      const itemCategory = mainContent[0].textContent.trim();
      const categoryValue = itemCategory
        .toLowerCase()
        .replace(/\s+&\s+|\s+/g, "-");
      const itemMedia = mainContent[1];
      const itemLabel =
        mainContent[2]?.children[0].children[0]?.textContent.trim() || "";
      const itemTitle =
        mainContent[2]?.children[0].children[1]?.textContent.trim() || "";
      const itemDescription = mainContent[3]?.textContent.trim();
      const itemCtaLink =
        mainContent[4]?.children[0].children[1]?.children[0] || "";
      let previewImage = "";

      if (mainContent[6].querySelector("picture")) {
        previewImage = mainContent[6].children[0];
      }

      if (currentCategory !== "all" && currentCategory !== categoryValue) {
        // If the item doesn't match the selected category, skip it
        return;
      }

      // Create the modal for this gallery item
      const openNextModal = () => {
        // Find the next modal in the filteredModals array
        const currentModalIndex = filteredModals.findIndex(
          (modal) => modal.element.id === `modal-${idx}`
        );
        const nextModalIndex = (currentModalIndex + 1) % filteredModals.length;

        if (filteredModals[nextModalIndex]) {
          filteredModals[nextModalIndex].open();
        }
      };
      const isLastItem = null;
      if (!itemCtaLink) {
        // Find the next item that also has a modal (no itemCtaLink)
        let nextItemData = {};
        let foundNextItem = false;

        // Look for next item starting from current index + 1
        for (let i = 1; i < galleryItems.length; i++) {
          const nextIdx = (idx + i) % galleryItems.length; // Wrap around to beginning if needed
          const nextItem = galleryItems[nextIdx];

          if (nextItem) {
            const nextRows = [...nextItem.children[0].children];
            const nextItemCtaLink =
              nextRows[4]?.children[0]?.children[1]?.children[0] || "";
            const nextItemCategory = nextRows[0].textContent.trim();
            const nextCategoryValue = nextItemCategory
              .toLowerCase()
              .replace(/\s+&\s+|\s+/g, "-");
            const itemUpNextText = nextRows[5]?.textContent.trim() || "";

            // Check if this item matches current category filter and doesn't have itemCtaLink
            const matchesCategory =
              currentCategory === "all" ||
              currentCategory === nextCategoryValue;

            if (!nextItemCtaLink && matchesCategory) {
              nextItemData = {
                itemUpNextText,
                itemImage:
                  nextRows[7]?.querySelector("picture")?.outerHTML || "",
              };
              foundNextItem = true;
              break;
            }
          }
        }

        // If no next modal item found, use empty data
        if (!foundNextItem) {
          nextItemData = {
            itemUpNextText: "",
            itemImage: "",
          };
        }

        const modal = createCarouselModal(
          mainContainer,
          `modal-${idx}`,
          slidesContent,
          parseModalSlide,
          openNextModal,
          isLastItem,
          nextItemData
        );
        modals[idx] = modal;
        filteredModals.push(modal);
      }

      const mediaWrapper = document.createElement("div");
      mediaWrapper.className = "media-wrapper";

      if (itemMedia) {
        // Clone the itemMedia node to avoid moving it from the original DOM
        const clonedMedia = itemMedia.cloneNode(true);
        handleMediaBlocks([clonedMedia], "", mediaWrapper, true, previewImage);
      }

      // Append each item to the grid section
      const gridSectionItem = `
       ${mediaWrapper.outerHTML}
          <div class="content-wrapper">
            <div class="content-header">
              <p class="text-l3">${itemLabel}</p>
              <h3 class="text-h3">${itemTitle}</h3>
            </div>
          </div>
        `;
      gridSection.innerHTML += `

      ${
        itemCtaLink
          ? `<a href="${
              itemCtaLink.href
            }" class="grid-content-item" data-category="${categoryValue}" data-modal-idx="${
              filteredModals.length - 1
            }">${gridSectionItem}</a>`
          : `   <div class="grid-content-item" data-category="${categoryValue}" data-modal-idx="${
              filteredModals.length - 1
            }">${gridSectionItem}</div>`
      }
      `;
    });

    // Re-attach modal open events after re-render
    const galleryItem = gridSection.querySelectorAll(".grid-content-item");
    galleryItem.forEach((item) => {
      const modalIdx = Number(item.dataset.modalIdx);
      item.addEventListener("click", (e) => {
        if (item.tagName === "A") return;
        e.stopPropagation();
        if (filteredModals[modalIdx]) {
          filteredModals[modalIdx].open();
        }
      });
    });

    // cache = gridSection;
  }

  /* ------------------------------ Category Tab ------------------------------ */
  function handleTabChange(categoryParams) {
    category = categoryParams;
    // Remove all modals from DOM before rendering new items
    mainContainer
      .querySelectorAll(".carousel-modal-gallery")
      .forEach((modal) => {
        if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
      });
    fadeOut(gridSection, () => {
      renderGalleryItems(category);
      fadeIn(gridSection);
    });
  }

  let currentActiveCategory = "all";

  const categories = [
    { value: "all", label: "All" },
    { value: "art-design", label: "Art & Design" },
    // { value: "culinary", label: "Culinary" },
    { value: "music", label: "Music" },
    { value: "wellbeing", label: "Wellbeing" },
  ];

  createCategoryTabs(
    mainContainer,
    categories,
    handleTabChange,
    currentActiveCategory
  );

  /* ---------------------------- Gallery Structure --------------------------- */
  mainContainer.appendChild(galleryItemsContainer);

  // Hide/show sections based on the toggle view
  const gridSection = document.createElement("section");
  gridSection.className = "grid-view fade-section";

  galleryItemsContainer.innerHTML = "";
  galleryItemsContainer.appendChild(gridSection);

  const modals = [];

  // Initial render
  renderGalleryItems(category);

  // Initial state
  gridSection.style.opacity = 1;
  gridSection.style.display = "";

  // Insert mobile filter in .section-header-wrapper (always)
  let mobileFilter = createMobileCategoryFilter(
    categories,
    currentActiveCategory,
    handleTabChange,
    mainContainer
  );

  const sectionHeaderWrapper = document.querySelector(
    ".section-header-wrapper"
  );

  sectionHeaderWrapper.appendChild(mobileFilter);

  // Update mobile filter and desktop tabs on category change
  const origHandleTabChange = handleTabChange;
  handleTabChange = function (categoryParams) {
    origHandleTabChange(categoryParams);
    // Remove and re-create the mobile filter to ensure correct text and active state
    if (mobileFilter && mobileFilter.parentNode) {
      mobileFilter.parentNode.removeChild(mobileFilter);
    }
    mobileFilter = createMobileCategoryFilter(
      categories,
      categoryParams,
      handleTabChange
    );
    const sectionHeaderWrapper = document.querySelector(
      ".section-header-wrapper"
    );
    if (sectionHeaderWrapper) {
      sectionHeaderWrapper.appendChild(mobileFilter);
    }
    // Sync mobile filter active state
    if (mobileFilter.setActiveCategory) {
      mobileFilter.setActiveCategory(categoryParams);
    }
    // Sync desktop tabs (if needed)
    const desktopTabs = document.querySelectorAll(
      ".category-tabs .category-tab"
    );
    desktopTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.value === categoryParams);
    });
  };

  // On resize, sync mobile filter to current category
  window.addEventListener("resize", () => {
    if (mobileFilter && mobileFilter.setActiveCategory) {
      mobileFilter.setActiveCategory(category);
    }
  });
}

gallery();
