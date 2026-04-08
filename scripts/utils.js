import {
  loadCSS,
  loadScript,
  isUniversalEditor,
  createOptimizedPicture,
  toCamelCase,
} from "./aem.js";

/**
 * Retrieves elements from a given block based on an array of selector objects.
 *
 * @param {Element} block - The parent DOM element to search within.
 * @param {Array<{key: string, sel: string}>} selectors - An array of objects, each containing:
 *   - key: The property name for the returned object.
 *   - sel: The CSS selector string to query elements.
 * @returns {Object<string, NodeListOf<Element>>} An object mapping each key to the NodeList of matched elements.
 */

export function getElements(block, selectors) {
  return Object.fromEntries(
    selectors.map(({ key, sel }) => [key, block.querySelectorAll(sel)])
  );
}

/**
 * Formats the child elements of a given DOM element by wrapping them in a new div with a specified class name,
 * and adds additional class names to each child based on its tag name and an optional text class name.
 * Only element children with non-empty text content are processed.
 *
 * @param {HTMLElement} element - The DOM element whose children will be formatted.
 * @param {string} wrapperClassName - The class name to assign to the wrapper div.
 * @param {string} [textClassName] - An optional class name to add to each child element.
 */
export function formatRichText(element, wrapperClassName, textClassName) {
  const wrapper = document.createElement("div");
  wrapper.className = wrapperClassName;
  const nodes = Array.from(element.children).filter(
    (child) => child.nodeType === 1 && child.textContent.trim() !== ""
  );
  nodes.forEach((node) => {
    const tag = node.tagName.toLowerCase();
    if (tag === "p" && node.querySelector("strong")) {
      node.classList.add("text-l3");
      node.querySelectorAll("strong").forEach((strong) => {
        strong.replaceWith(...strong.childNodes);
      });
    } else if (tag === "h1") {
      const h2 = document.createElement("h2");
      h2.innerHTML = node.innerHTML;
      h2.classList.add("text-h1", "split-text");
      if (textClassName) {
        h2.classList.add(textClassName);
      }
      wrapper.appendChild(h2);
      return;
    } else {
      if (tag === "p") {
        node.classList.add("text-p1");
      }
      node.classList.add(`text-${tag}`, "split-text");
    }
    if (textClassName) {
      node.classList.add(textClassName);
    }
    wrapper.appendChild(node);
  });
  element.innerHTML = "";
  element.appendChild(wrapper);
}

/**
 * Fetch placeholders from the appropriate JSON file based on the document language.
 * Caches the placeholders to avoid multiple requests for the same language.
 * @returns {Promise<Object>} Promise that resolves to the placeholders object
 */
export async function fetchPlaceholders() {
  const lang = document.documentElement.lang || "default";

  if (
    window.placeholders?.[lang] &&
    !(window.placeholders[lang] instanceof Promise)
  ) {
    return window.placeholders[lang];
  }

  if (window.placeholders?.[lang] instanceof Promise) {
    return window.placeholders[lang];
  }

  window.placeholders = window.placeholders || {};
  window.placeholders[lang] = new Promise(async (resolve) => {
    try {
      const url =
        lang === "default" || lang === "en"
          ? "/placeholders.json"
          : `/${lang}/placeholders.json`;

      const resp = await fetch(url);
      const json = resp.ok ? await resp.json() : {};

      const placeholders = {};
      (json.data || [])
        .filter((placeholder) => placeholder.Key)
        .forEach((placeholder) => {
          placeholders[toCamelCase(placeholder.Key)] = placeholder.Text;
        });

      resolve(placeholders);
    } catch (err) {
      console.error("error loading placeholders", err);
      resolve({});
    }
  });

  const result = await window.placeholders[lang];
  window.placeholders[lang] = result;
  return result;
}

const placeholders = await fetchPlaceholders();

/**
 * Handles media blocks (images/videos) and appends them to section.
 * @param {NodeListOf<Element>} media
 * @param {NodeListOf<Element>} imgAltText
 * @param {HTMLElement} section
 */
export function handleMediaBlocks(
  media,
  imgAltText,
  section,
  lazy = true,
  posterImage = ""
) {
  let posterSrc = "/img/poster.jpg";
  if (posterImage) {
    posterSrc = posterImage?.querySelector("img")?.src || "";
  }

  media.forEach((child, idx) => {
    const isVideo = !child.querySelector("picture");
    if (isVideo) {
      const anchor = child.querySelector("a");
      if (anchor) {
        const video = document.createElement("video");
        video.className = "slide-video";
        video.playsInline = true;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.style.width = "100%";
        video.style.height = "auto";
        video.style.opacity = "1";
        video.setAttribute("aria-label", "Video player");
        video.controls = false;
        video.setAttribute("muted", "");
        video.muted = true;
        video.preload = lazy ? "none" : "auto";
        video.poster = posterSrc;

        if (lazy) {
          video.classList.add("lazy"); // needed for LazyLoad
          video.dataset.autoplay = ""; // LazyLoad handles autoplay
        } else {
          video.classList.add("eager");
        }

        const href = anchor.innerText.trim();
        const basePath = getBasePathBasedOnEnv();
        const baseName = href.replace(/\.[^/.]+$/, ""); // Remove extension

        // WebM source
        // const webmSource = document.createElement("source");
        // if (lazy) {
        //   webmSource.setAttribute("data-src", basePath + baseName + ".webm");
        // } else {
        //   webmSource.src = basePath + baseName + ".webm";
        // }
        // webmSource.type = "video/webm";

        // MP4 source (fallback)
        const mp4Source = document.createElement("source");
        if (lazy) {
          mp4Source.dataset.src = basePath + baseName + ".mp4";
        } else {
          mp4Source.src = basePath + baseName + ".mp4";
        }
        mp4Source.type = "video/mp4";

        //video.appendChild(webmSource);
        video.appendChild(mp4Source);

        anchor.parentElement.remove();
        child.appendChild(video);
      }
    } else {
      const picture = child.querySelector("picture");
      const img = picture?.querySelector("img");
      if (img) {
        // Use createOptimizedPicture to generate a new optimized <picture>
        const src = img.src || img.getAttribute("src");
        let alt = img.alt || "";
        if (
          imgAltText &&
          imgAltText[idx] &&
          imgAltText[idx].textContent.trim()
        ) {
          alt = imgAltText[idx].textContent.trim();
        }
        const optimizedPicture = createOptimizedPicture(
          src,
          alt,
          lazy !== "true",
          [
            { media: "(min-width: 600px)", width: "1200" },
            { width: "1000" },
          ]
        );
        if (picture) {
          picture.replaceWith(optimizedPicture);
        }
      }
    }

    if (section) {
      const childDiv = document.createElement("div");
      childDiv.appendChild(child);
      section.appendChild(childDiv);
    }
  });
}

/**
 * Loads Swiper CSS/JS dependencies (idempotent).
 * @returns {Promise<void>}
 */
export async function loadSwiper() {
  if (window.Swiper) return;
  await Promise.all([
    loadCSS(`${window.hlx.codeBasePath}/styles/swiper-bundle.css`),
    loadScript(`${window.hlx.codeBasePath}/scripts/swiper-bundle.min.js`),
  ]);

  // Wait for Swiper to be available on the global scope
  return new Promise((resolve) => {
    const checkSwiper = () => {
      if (window.Swiper) {
        resolve();
      } else {
        setTimeout(checkSwiper, 10);
      }
    };
    checkSwiper();
  });
}

/**
 * Disables scrolling by storing the current scroll position and applying CSS classes/styles
 * to prevent scroll while preserving the current viewport position.
 *
 * @returns {Function} A function to restore scrolling to the original position
 */
export function disableScroll(type = "default") {
  const body = document.body;
  const scrollY = window.scrollY;

  // Store current scroll position
  body.style.setProperty("--scroll-lock-top", `-${scrollY}px`);
  const navbar = document.querySelector("nav, .navbar, #navbar");
  if (navbar && type === "default") {
    navbar.style.opacity = "0";
    navbar.style.display = "none";
  }
  setTimeout(() => {
    body.classList.add("no-scroll");
  }, 1000);

  // Return a function to restore scroll
  return function restoreScroll() {
    const savedScrollY =
      parseInt(body.style.getPropertyValue("--scroll-lock-top")) || 0;
    body.style.removeProperty("--scroll-lock-top");
    const navbar = document.querySelector("nav, .navbar, #navbar");
    navbar.style.opacity = "";
    body.classList.remove("no-scroll");
    if (navbar && type === "default") {
      setTimeout(() => {
        navbar.style.display = "";
        navbar.style.opacity = "1";
      }, 1000);
    }
    window.scrollTo(0, -savedScrollY);
  };
}

/**
 * Creates an interactive category tabs component with animated slider
 * @param {HTMLElement} container - The container element to append the tabs to
 * @param {Array} categories - Array of category objects with {value, label} structure
 * @param {Function} onTabChange - Callback function called when tab changes (receives category value)
 * @param {string} activeCategory - Initial active category (defaults to first category)
 * @returns {HTMLElement} The created tabs container element
 */
export function createCategoryTabs(
  container,
  categories,
  onTabChange = () => {},
  activeCategory = null
) {
  // Set default active category to first item if not provided
  const defaultActive = activeCategory || categories[0]?.value || "all";

  // Create outer wrapper
  const outerWrapper = document.createElement("div");
  outerWrapper.className = "category-tabs-wrapper";

  // Create tabs container
  const categoryTabs = document.createElement("div");
  categoryTabs.className = "category-tabs";

  // Create slider element
  const slider = document.createElement("div");
  slider.className = "category-slider";
  categoryTabs.appendChild(slider);

  outerWrapper.appendChild(categoryTabs);
  container.appendChild(outerWrapper);

  // Add tabs functionality after DOM is ready
  setTimeout(() => {
    const sliderElement = categoryTabs.querySelector(".category-slider");

    // Generate tabs HTML from categories array
    const categoryTabsHTML = categories
      .map((category) => {
        const isActive = category.value === defaultActive ? "active" : "";
        return `<button class="category-tab text-b text-text-white ${isActive}" data-category="${category.value}">${category.label}</button>`;
      })
      .join("");

    // Insert the buttons before the slider
    sliderElement.insertAdjacentHTML("beforebegin", categoryTabsHTML);

    const tabs = categoryTabs.querySelectorAll(".category-tab");

    // Function to set the slider position
    function setSliderPosition(tab) {
      sliderElement.style.left = `${tab.offsetLeft}px`;
      sliderElement.style.width = `${tab.offsetWidth}px`;
    }

    // Set initial position for the active tab
    const initialActiveTab = categoryTabs.querySelector(".category-tab.active");
    if (initialActiveTab) {
      // Function to initialize slider
      const initializeSlider = () => {
        // Ensure slider has transition properties
        sliderElement.style.transition =
          "left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)";

        // Check if tab has dimensions
        if (initialActiveTab.offsetWidth > 0) {
          setSliderPosition(initialActiveTab);
        } else {
          // If no dimensions yet, try again
          requestAnimationFrame(initializeSlider);
        }
      };

      // Start initialization
      requestAnimationFrame(initializeSlider);
    }

    // Add click event listener to each tab
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        // Remove active class from all tabs
        tabs.forEach((t) => t.classList.remove("active"));
        // Add active class to the clicked tab
        tab.classList.add("active");
        // Move the slider
        setSliderPosition(tab);

        // Call the callback function with the selected category
        onTabChange(tab.dataset.category);
      });
    });

    // Adjust slider on window resize
    const handleResize = () => {
      const activeTab = categoryTabs.querySelector(".category-tab.active");
      if (activeTab) {
        // Disable transition during resize for instant adjustment
        sliderElement.style.transition = "none";
        setSliderPosition(activeTab);
        // Re-enable transition after a short delay
        setTimeout(() => {
          sliderElement.style.transition =
            "left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)";
        }, 50);
      }
    };

    window.addEventListener("resize", handleResize);

    // Return cleanup function if needed
    categoryTabs._cleanup = () => {
      window.removeEventListener("resize", handleResize);
    };
  }, 0);

  // Add scroll overlays for mobile if tabs overflow horizontally
  function addScrollOverlays() {
    const leftOverlay = document.createElement("div");
    leftOverlay.className = "category-tabs-scroll-overlay left";
    leftOverlay.style.display = "none";
    leftOverlay.style.opacity = "0";
    leftOverlay.style.transition = "opacity 0.4s";
    outerWrapper.appendChild(leftOverlay);

    const rightOverlay = document.createElement("div");
    rightOverlay.className = "category-tabs-scroll-overlay right";
    rightOverlay.style.display = "none";
    rightOverlay.style.opacity = "0";
    rightOverlay.style.transition = "opacity 0.4s";
    outerWrapper.appendChild(rightOverlay);

    function updateOverlays() {
      const scrollLeft = categoryTabs.scrollLeft;
      const maxScrollLeft = categoryTabs.scrollWidth - categoryTabs.clientWidth;

      // Use a slightly larger epsilon to avoid flicker on tiny scrolls
      const epsilon = 8;

      // Show left overlay only if scrolled more than epsilon
      if (scrollLeft > epsilon) {
        leftOverlay.style.display = "block";
        leftOverlay.style.opacity = "1";
      } else {
        leftOverlay.style.opacity = "0";
        setTimeout(() => {
          // Only hide if still at left edge (avoid flicker)
          if (categoryTabs.scrollLeft <= epsilon) {
            leftOverlay.style.display = "none";
          }
        }, 400);
      }

      // Show right overlay only if not at max scroll
      if (scrollLeft < maxScrollLeft - epsilon) {
        rightOverlay.style.display = "block";
        rightOverlay.style.opacity = "1";
      } else {
        rightOverlay.style.opacity = "0";
        setTimeout(() => {
          // Only hide if still at right edge
          if (categoryTabs.scrollLeft >= maxScrollLeft - epsilon) {
            rightOverlay.style.display = "none";
          }
        }, 400);
      }
    }

    categoryTabs.addEventListener("scroll", updateOverlays);
    window.addEventListener("resize", updateOverlays);

    // Initial check
    setTimeout(updateOverlays, 10);
  }

  addScrollOverlays();

  return outerWrapper;
}

/* ------------------------- Parallax Slides Effect ------------------------- */
/**
 * Utility: Clamp a number between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Set the height of the container based on the number of sections
 * @param {HTMLElement} container
 * @param {number} numSections
 */
export function setContainerHeight(container, numSections) {
  if (container) {
    container.style.height = `${numSections * 100}vh`;
  }
}

/**
 * Position and center each content wrapper absolutely
 * @param {HTMLElement[]} wrappers
 */
export function positionContentWrappers(wrappers) {
  wrappers.forEach((wrapper, idx) => {
    Object.assign(wrapper.style, {
      position: "absolute",
      top: `${idx * 100}vh`,
      left: "0",
      width: "100%",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    });
  });
}

/**
 * Setup parallax effect for a section
 * @param {HTMLElement} listView
 * @param {HTMLElement} parallaxContent
 * @param {HTMLElement} parallaxMedia
 */
export function setupParallaxEffect(listView, parallaxContent, parallaxMedia) {
  if (!listView) return;
  const contentWrappers = Array.from(
    parallaxContent.querySelectorAll(".parallax-item")
  );
  const mediaSlides = Array.from(
    parallaxMedia.querySelectorAll(".parallax-item")
  );
  setContainerHeight(listView, contentWrappers.length);
  positionContentWrappers(contentWrappers);
  let activeIndex = 0;
  function updateSlides(activeIdx) {
    contentWrappers.forEach((wrapper, idx) => {
      wrapper.classList.toggle("active", idx === activeIdx);
    });
    mediaSlides.forEach((slide, idx) => {
      slide.classList.toggle("active", idx === activeIdx);
    });
  }
  function handleScroll() {
    const rect = listView.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const containerTop = rect.top + scrollY;
    const vh = window.innerHeight;
    let currentIndex = Math.floor((scrollY - containerTop + vh / 2) / vh);
    currentIndex = clamp(currentIndex, 0, contentWrappers.length - 1);
    if (currentIndex !== activeIndex) {
      activeIndex = currentIndex;
      updateSlides(activeIndex);
    }
  }
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", handleScroll);
  updateSlides(activeIndex);

  return { activeIndex };
}

/* -------------------------- Artist Card and Modal ------------------------- */
export function createArtistCard(artistImage, artistName, uniqueId) {
  return `
    <div class="artist-card" data-artist-id="${uniqueId}">
      <div class="artist-image-wrapper">
        <div class="image-wrapper">${artistImage}</div>
      </div>
      <div class="artist-content">
        <p class="artist-label text-l2 text-text-white-500">${
          placeholders.artistLabel || "Artist"
        }</p>
        <p class="artist-name text-l2 text-text-white">${artistName}</p>
      </div>
    </div>
  `;
}

export function showArtistModal(artistModalContent, uniqueId) {
  const image = artistModalContent.querySelector("picture");
  const titleText =
    artistModalContent?.querySelector("h2")?.textContent.trim() ||
    artistNameValue;
  const bodyText =
    artistModalContent?.querySelectorAll("p")[1]?.textContent.trim() || "";

  // Create modal structure first
  const modal = document.createElement("dialog");
  modal.className = "artist-modal inactive";
  modal.id = `artist-modal-${uniqueId}`;
  modal.dataset.artistId = uniqueId;

  // Set initial content with default close text
  modal.innerHTML = `
    <div class="artist-modal-content">
      <div class="artist-modal-image">
        ${image.outerHTML}
      </div>
      <div class="artist-modal-text">
        <h2 class="artist-text-content text-text-black">${titleText}</h2>
        <p class="text-p2">${bodyText}</p>
      </div>
      <button class="artist-modal-close text-b close-icon icon-left" aria-label="Close modal">
        <span class="animate-underline">${
          placeholders.globalClose || "CLOSE"
        }</span>
      </button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.classList.add("inactive");
  document.body.style.overflow = "";

  function openModal() {
    if (!modal.open) modal.showModal();
    modal.classList.remove("inactive");
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("active");
    modal.classList.add("inactive");
    modal.close();
    document.body.style.overflow = "";
  }

  const closeBtn = modal.querySelector(".artist-modal-close");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) closeModal();
  });

  return { openModal, modal, uniqueId };
}

/**
 * Helper function to setup click event for artist card to open corresponding modal
 * @param {string} uniqueId - The unique identifier for the artist card/modal pair
 * @param {Function} openModalFn - The openModal function returned by showArtistModal
 */
export function setupArtistCardClickHandler(uniqueId, openModalFn) {
  const artistCard = document.querySelector(`[data-artist-id="${uniqueId}"]`);
  if (artistCard) {
    artistCard.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModalFn();
    });
    artistCard.style.cursor = "pointer";
  }
}

/**
 * Helper function to find and open a specific artist modal by ID
 * @param {string} uniqueId - The unique identifier for the modal
 */
export function openArtistModalById(uniqueId) {
  const modal = document.getElementById(`artist-modal-${uniqueId}`);
  if (modal && modal.openModal) {
    modal.openModal();
  }
}

export function getSite() {
  const pathname = window.location.pathname.toLowerCase();
  if (pathname.includes("gha-discovery/profile")) return "osaka";
  const sites = ["/maldives", "/osaka", "/tianjin", "/sanya"];
  for (const site of sites) {
    if (pathname.includes(site)) return site.replace("/", "");
  }
  return "";
}

export function getLanguage() {
  const language = document.documentElement.lang || "en";
  return language;
}

/**
 * Creates a custom dropdown UI with radio options and handles open/close, selection, and fade transitions.
 * @param {Object} params
 * @param {string[]} options - Array of option labels.
 * @param {number} selectedIndex - Index of the initially selected option.
 * @param {function(number):void} onSelect - Callback when an option is selected (receives selected index).
 * @param {string} [dropdownName] - Optional unique name for the radio group.
 * @returns {HTMLElement} The dropdown wrapper element.
 */
export function createCustomDropdown({
  options,
  selectedIndex,
  onSelect,
  dropdownName = "dropdown",
}) {
  const optionsHtml = options
    .map(
      (title, i) => `
        <label class="filter-subcategory text-l2">
          <span>${title}</span>
          <input type="radio" name="${dropdownName}" value="${i}" ${
        i === selectedIndex ? "checked" : ""
      }>
        </label>
      `
    )
    .join("");
  const dropdownHtml = `
    <div class="filter-button-wrapper">
      <button class="pill-dropdown-button" type="button" aria-expanded="false">${
        options[selectedIndex] || "Select Option"
      }</button>
      <div class="events-filter-dropdown" aria-open="false">
        <div class="filter-dropdown-inner">
          ${optionsHtml}
        </div>
      </div>
    </div>
  `;
  const filterWrapper = document.createElement("div");
  filterWrapper.innerHTML = dropdownHtml;
  filterWrapper.className = "pill-dropdown-wrapper";
  const pillBtn = filterWrapper.querySelector(".pill-dropdown-button");
  const dropdown = filterWrapper.querySelector(".events-filter-dropdown");
  const radios = filterWrapper.querySelectorAll("input[type=radio]");

  pillBtn.addEventListener("click", () => {
    const expanded = pillBtn.getAttribute("aria-expanded") === "true";
    pillBtn.setAttribute("aria-expanded", expanded ? "false" : "true");
    dropdown.setAttribute("aria-open", expanded ? "false" : "true");
    if (!expanded) {
      // Add outside click handler only when opening
      const handleClick = (e) => {
        if (!filterWrapper.contains(e.target)) {
          pillBtn.setAttribute("aria-expanded", "false");
          dropdown.setAttribute("aria-open", "false");
          document.removeEventListener("mousedown", handleClick, true);
        }
      };
      setTimeout(() => {
        document.addEventListener("mousedown", handleClick, true);
      }, 0);
    }
  });
  radios.forEach((input) => {
    input.addEventListener("change", (e) => {
      if (input.checked) {
        pillBtn.textContent = options[input.value];
        pillBtn.setAttribute("aria-expanded", "false");
        dropdown.setAttribute("aria-open", "false");
        if (typeof onSelect === "function") onSelect(Number(input.value));
      }
    });
  });
  return filterWrapper;
}

/**
 * Creates and attaches a tooltip card to a parent element.
 * @param {Object} options - Tooltip options
 * @param {HTMLElement} options.parent - The parent element to append the tooltip to
 * @param {string} options.componentName - Unique slide name/id
 * @param {number|string} options.idx - Index or unique identifier
 * @param {string} options.tooltipX - X position (percentage string)
 * @param {string} options.tooltipY - Y position (percentage string)
 * @param {HTMLElement} options.imageContent - Image node or HTML string
 * @param {string} options.titleContent - Tooltip title
 * @param {string} options.descriptionContent - Tooltip description
 * @param {boolean} [options.showTooltip] - Whether to show the tooltip
 * @param {string} options.mobileTooltipX - Mobile X position (percentage string)
 * @param {string} options.mobileTooltipY - Mobile Y position (percentage string)
 */
export function createTooltipCard({
  parent,
  componentName,
  idx,
  tooltipX,
  tooltipY,
  imageContent,
  titleContent,
  descriptionContent,
  showTooltip = true,
  mobileTooltipX = null,
  mobileTooltipY = null,
  mainParent,
}) {
  if (!showTooltip) return;

  // Create tooltip wrapper
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip-wrapper";

  // Helper to set position based on screen size
  const isMobile = window.innerWidth <= 768;
  tooltip.style.left = `${
    isMobile && mobileTooltipX !== null ? mobileTooltipX : tooltipX
  }%`;
  tooltip.style.top = `${
    isMobile && mobileTooltipY !== null ? mobileTooltipY : tooltipY
  }%`;

  tooltip.innerHTML = `
    <div class="tooltip-pointer card" data-slide="${componentName}" data-idx="${idx}">
      <div></div>
    </div>
  `;
  parent.appendChild(tooltip);

  // Initialize tippy for this tooltip card
  setTimeout(() => {
    const instance = tippy(
      `.tooltip-pointer.card[data-slide="${componentName}"][data-idx="${idx}"]`,
      {
        content: `   <div class="tooltip-content">
      <div class="image-wrapper">
        ${imageContent.innerHTML}
      </div>
      <div class="content">
        <h5 class="text-h5 text-text-black">${titleContent}</h5>
        <p class="text-p3 text-text-black">${descriptionContent}</p>
      </div>
      </div>   `,
        allowHTML: true,
        arrow: false,
        placement: "right",
        duration: 600,
        trigger: "click",
        zIndex: 499,
        popperOptions: {
          strategy: "fixed",
          modifiers: [
            {
              name: "flip",
              options: { fallbackPlacements: ["bottom", "right"] },
            },
            {
              name: "preventOverflow",
              options: { altAxis: true, tether: false, padding: 100 },
            },
          ],
        },
        onMount(ins) {
          if (window.innerWidth > 767) {
            if (componentName === "slide-with-bottom-left-text-and-tooltip") {
              ins.setProps({
                popperOptions: {
                  strategy: "fixed",
                  modifiers: [{ name: "preventOverflow", enabled: false }],
                },
              });
            } else if (componentName === "large-carousel-with-tooltip-card") {
              ins.setProps({
                popperOptions: {
                  strategy: "fixed",
                },
              });
            }
          }
        },
        appendTo:
          componentName === "large-carousel-with-tooltip-card"
            ? parent.parentElement.parentElement
            : document.body,
        hideOnClick: true,
      }
    );

    // Show the first tooltip by default
    if (idx === 0 && instance && instance[0]) {
      instance[0].show();
    }

    switch (componentName) {
      case "large-carousel-with-tooltip-card":
        const showInstanceWithDelay = () => {
          setTimeout(() => {
            instance[0].show();
          }, 200);
        };

        // Always hide tooltip initially
        instance.forEach((ins) => ins.hide());

        // On mobile (<768px), keep tooltip closed by default
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          instance.forEach((ins) => ins.hide());
        }

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting && !isMobile) {
              showInstanceWithDelay();
            } else {
              instance.forEach((ins) => ins.hide());
            }
          },
          { threshold: 0.8 }
        );
        observer.observe(parent);

        // Hide tooltip immediately on scroll or resize if parent is not visible
        const hideTooltipOnScrollOrResize = () => {
          const rect = parent.getBoundingClientRect();
          const inView =
            rect.top < window.innerHeight &&
            rect.bottom > 0 &&
            rect.left < window.innerWidth &&
            rect.right > 0;
          // On mobile, always hide
          if (!inView || window.innerWidth < 768) {
            instance.forEach((ins) => ins.hide());
          }
        };
        window.addEventListener("scroll", hideTooltipOnScrollOrResize);
        window.addEventListener("resize", hideTooltipOnScrollOrResize);
        break;
      case "slide-with-bottom-left-text-and-tooltip":
        const activeParent = mainParent.querySelectorAll(
          ".slide-with-bottom-left-text-and-tooltip"
        )[idx];
        // Show/hide tooltip instance based on top of mainParent in viewport
        function handleTooltipVisibility() {
          const rect = mainParent.getBoundingClientRect();
          const topInViewport = rect.top;
          const threshold = window.innerHeight * 0.5;
          const isMobile = window.innerWidth < 768;

          // Check if parent is at least halfway in viewport
          const halfViewport = window.innerHeight * 0.5;
          const parentInView =
            rect.top < halfViewport && rect.bottom > halfViewport;

          if (
            !isMobile &&
            topInViewport < threshold &&
            activeParent.classList.contains("active") &&
            parentInView
          ) {
            instance[0].show();
          } else {
            instance.forEach((ins) => ins.hide());
          }
        }
        window.addEventListener("scroll", handleTooltipVisibility);
        window.addEventListener("resize", handleTooltipVisibility);
        // Initial check
        handleTooltipVisibility();
        break;
    }
  }, 100);

  tooltip.onclick = (e) => {
    e.stopPropagation();
    e.target._tippy.show();
  };
}

export function getBasePathBasedOnEnv() {
  switch (window.location.hostname) {
    // Prod
    case "author-p152536-e1711605.adobeaemcloud.com":
    case "main--patina--capellahotelgroup.aem.live":
    case "main--patina--capellahotelgroup.aem.page":
      return "https://publish-p152536-e1711605.adobeaemcloud.com";
    // Staging
    case "stg--patina-stg--capellahotelgroup.aem.page":
    case "stg--patina-stg--capellahotelgroup.aem.live":
    case "author-p152536-e1711606.adobeaemcloud.com":
      return "https://publish-p152536-e1711606.adobeaemcloud.com";
    // UAT
    case "uat--patina-uat--capellahotelgroup.aem.live":
    case "uat--patina-uat--capellahotelgroup.aem.page":
    case "author-p152536-e1712200.adobeaemcloud.com":
      return "https://publish-p152536-e1712200.adobeaemcloud.com";
    // Dev
    case "localhost":
    case "author-p152536-e1620746.adobeaemcloud.com":
    case "dev--patina-dev--capellahotelgroup.aem.live":
    case "dev--patina-dev--capellahotelgroup.aem.page":
      return "https://publish-p152536-e1620746.adobeaemcloud.com";
    default:
      return "";
  }
}
/* ------------------------- Mobile Dropdown Filter ------------------------- */
export function createMobileCategoryFilter(
  categories,
  currentCategory,
  onChange,
  section
) {
  const filter = document.createElement("div");
  filter.className = "mobile-category-filter visible";
  const pill = document.createElement("div");
  pill.className = "mobile-filter-pill";
  // Current selected
  const current = document.createElement("div");
  current.className = "mobile-filter-current text-b";
  const currentText = document.createElement("span");
  currentText.className = "mobile-filter-current-text text-b";
  currentText.textContent =
    categories.find((c) => c.value === currentCategory)?.label || "";
  current.appendChild(currentText);
  pill.appendChild(current);
  // Hamburger
  const hamburger = document.createElement("div");
  hamburger.className = "mobile-filter-hamburger";
  hamburger.innerHTML = `<span></span><span></span><span></span>`;
  pill.appendChild(hamburger);
  // Options
  const options = document.createElement("div");
  options.className = "mobile-filter-options text-b";
  categories.forEach((cat) => {
    const opt = document.createElement("div");
    opt.className =
      "mobile-filter-option" + (cat.value === currentCategory ? " active" : "");
    opt.textContent = cat.label;
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      // Always update UI and call onChange, even if already selected (fixes 'All' issue)
      setActiveCategory(cat.value);
      onChange(cat.value);
      pill.classList.remove("expanded");
    });
    options.appendChild(opt);
  });
  pill.appendChild(options);
  // Toggle expand/collapse
  function toggleExpand(e) {
    e.stopPropagation();
    pill.classList.toggle("expanded");
  }
  hamburger.addEventListener("click", toggleExpand);
  pill.addEventListener("click", (e) => {
    if (!pill.classList.contains("expanded")) toggleExpand(e);
  });
  // Collapse on outside click
  document.addEventListener("click", (e) => {
    if (!pill.contains(e.target)) pill.classList.remove("expanded");
  });
  filter.appendChild(pill);

  // Expose a method to programmatically set active category
  function setActiveCategory(newCategory) {
    currentText.textContent =
      categories.find((c) => c.value === newCategory)?.label || "";
    options.querySelectorAll(".mobile-filter-option").forEach((o, idx) => {
      o.classList.toggle("active", categories[idx].value === newCategory);
    });
  }
  filter.setActiveCategory = setActiveCategory;
  return filter;
}

/* ------------------- Mutation Observer for AEM Authoring ------------------ */
export function handleAuthoringContentChange(container, func) {
  function observeDOMChanges() {
    if (!isUniversalEditor()) return;
    const main = document.querySelector(container);

    if (!main) {
      setTimeout(observeDOMChanges, 100);
      return;
    }

    // 2. Create a debounced version of your function.
    // 300ms is a good starting point for the delay.
    const debouncedOnChange = debounce(onContentChange, 300);

    // The observer's callback now only calls the debounced function.
    const callback = () => {
      // We don't need to loop or check mutations anymore.
      // We just signal that *a* change happened.
      debouncedOnChange();
    };

    const observer = new MutationObserver(callback);

    const config = {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    };

    observer.observe(main, config);
  }

  // Start the observer
  observeDOMChanges();

  function debounce(func, delay) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, delay);
    };
  }

  function onContentChange() {
    func();
  }
}

/* ---------------------- Carousel Modal Authoring Env ---------------------- */
export function handleEditorEnvCarouselModals(modalsContent) {
  const section = document.createElement("section");
  const scrollContainer = document.createElement("div");
  scrollContainer.classList.add("carousel-modal-scroll-container");

  section.appendChild(scrollContainer);
  section.classList.add("carousel-modal-section");

  modalsContent.forEach((modal) => {
    const modalType = modal.children[0].textContent
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-"); // Convert to kebab casing
    if (modalType) {
      modal.classList.add(modalType);
    }

    const media = modal.children[2];
    handleMediaBlocks([media], [], modal);

    scrollContainer.appendChild(modal);
  });
  return section;
}

/* ---------------------------- Date Box Formatter --------------------------- */
/**
 * Formats start and end dates into a stylized date box HTML string.
 * Handles various scenarios including single dates, same month ranges, and different month ranges.
 * @param {string} startDateStr - The start date string (ISO format recommended).
 * @param {string} endDateStr - The end date string (ISO format recommended).
 * @returns {string} The formatted date box HTML string.
 */
export const formatDateBox = (startDateStr, endDateStr) => {
  const lang = getLanguage();
  const locale = lang === "en" ? "en-US" : lang;

  if (!startDateStr && !endDateStr) return "";

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return {
      month: date.toLocaleDateString(locale, { month: "short" }).toUpperCase(),
      day: date.getDate().toString().padStart(2, "0"),
    };
  };

  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);

  if (!start && !end) return "";

  // If only one date or both dates are the same
  if (!end || (start && end && startDateStr === endDateStr)) {
    return `
        <div class="date-box">
          <div class="date-month text-l3">${start.month}</div>
          <div class="date-day text-l3">${start.day}</div>
        </div>
      `;
  }

  // If different months, show both month-day combinations
  if (start.month !== end.month) {
    return `
        <div class="date-box date-box-range">
          <div class="date-column">
            <div class="date-month text-l3">${start.month}</div>
            <div class="date-day text-l3">${start.day}</div>
          </div>
          <div class="date-separator text-l3">-</div>
          <div class="date-column">
            <div class="date-month text-l3">${end.month}</div>
            <div class="date-day text-l3">${end.day}</div>
          </div>
        </div>
      `;
  }

  // Same month, different days
  return `
      <div class="date-box">
        <div class="date-month text-l3">${start.month}</div>
        <div class="date-day text-l3">${start.day}-${end.day}</div>
      </div>
    `;
};

/* ------------------ Infinity Scrolling Horizontal Gallery ----------------- */

// Store all ticker timelines globally for external control, organized by component
window.__capellaNewsTickerTimelines = window.__capellaNewsTickerTimelines || {};

export function applyNewsTickerAnimation(
  componentName = "default",
  containerSelector = ".cards"
) {
  // Initialize component-specific timeline array if it doesn't exist
  if (!window.__capellaNewsTickerTimelines[componentName]) {
    window.__capellaNewsTickerTimelines[componentName] = [];
  }

  // If timelines already exist for this component, remove them before creating new ones
  if (window.__capellaNewsTickerTimelines[componentName].length > 0) {
    window.__capellaNewsTickerTimelines[componentName].forEach((tl) => {
      if (tl && tl.kill) tl.kill();
    });
    window.__capellaNewsTickerTimelines[componentName].length = 0;
  }

  let loops = gsap.utils.toArray(containerSelector).map((line, i) => {
    const links = line.querySelectorAll(`${containerSelector} li`),
      tickerDirection = false,
      tl = horizontalLoop(links, {
        repeat: -1,
        speed: 1,
        paused: true, // Start paused
        reversed: tickerDirection,
        paddingRight: parseFloat(
          gsap.getProperty(links[0], "marginRight", "px")
        ),
        threshold: -(links[0].offsetWidth + 20),
      });

    // Add component identifier to the timeline
    tl._componentName = componentName;

    // Store timeline for external control under the specific component
    window.__capellaNewsTickerTimelines[componentName].push(tl);

    // Start the loop after 1000ms
    setTimeout(() => {
      tl.play();
      gsap.to(tl, { timeScale: 1, overwrite: true });
    }, 1000);
    links.forEach((link) => {
      link.addEventListener("mouseenter", () =>
        gsap.to(tl, { timeScale: 0, overwrite: true })
      );
      link.addEventListener("mouseleave", () =>
        gsap.to(tl, { timeScale: 1, overwrite: true })
      );
    });

    // --- Infinite manual scroll with wrapping ---
    let scrollTimeout;
    let isUserScrolling = false;
    const numCards = links.length || 1;

    // --- Wheel/Touchpad: move GSAP loop ---
    const wheelHandler = (e) => {
      // Invert logic: scrolling up (deltaY < 0) moves right, down (deltaY > 0) moves left
      let delta;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Horizontal scroll (trackpad)
        // Reduce sensitivity by increasing the divisor (e.g., 4500 instead of 1000)
        delta = e.deltaX / (numCards * 562);
      } else {
        // Vertical scroll: up = right, down = left
        delta = e.deltaY / (numCards * 562);
      }
      if (delta !== 0) {
        gsap.to(tl, { timeScale: 0, overwrite: true });
        isUserScrolling = true;
        let newProgress = tl.progress() + delta;
        if (newProgress > 1) newProgress -= 1;
        if (newProgress < 0) newProgress += 1;
        tl.progress(newProgress, false);
        e.preventDefault();
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          gsap.to(tl, { timeScale: 1, overwrite: true });
          isUserScrolling = false;
        }, 2000);
      }
    };
    line.addEventListener("wheel", wheelHandler, { passive: false });
    line._gsapTickerWheelHandler = wheelHandler;
    line._componentName = componentName; // Add component identifier to the element

    // --- Touch support for mobile: move GSAP loop ---
    let startX = 0;
    let startProgress = 0;
    const touchStartHandler = (e) => {
      if (e.touches.length === 1) {
        gsap.to(tl, { timeScale: 0, overwrite: true });
        isUserScrolling = true;
        startX = e.touches[0].clientX;
        startProgress = tl.progress();
      }
    };
    const touchMoveHandler = (e) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - startX;
        let newProgress = startProgress - dx / 1000;
        if (newProgress > 1) newProgress -= 1;
        if (newProgress < 0) newProgress += 1;
        tl.progress(newProgress, false);
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          gsap.to(tl, { timeScale: 1, overwrite: true });
          isUserScrolling = false;
        }, 2000);
      }
    };
    const touchEndHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        gsap.to(tl, { timeScale: 1, overwrite: true });
        isUserScrolling = false;
      }, 2000);
    };
    line.addEventListener("touchstart", touchStartHandler);
    line.addEventListener("touchmove", touchMoveHandler);
    line.addEventListener("touchend", touchEndHandler);
    line._gsapTickerTouchStartHandler = touchStartHandler;
    line._gsapTickerTouchMoveHandler = touchMoveHandler;
    line._gsapTickerTouchEndHandler = touchEndHandler;
    line._componentName = componentName; // Add component identifier to the element
  });
}

function horizontalLoop(items, config) {
  items = gsap.utils.toArray(items);
  config = config || {};
  const threshold = config.threshold || 0; // threshold in px, default 0
  let tl = gsap.timeline({
      repeat: config.repeat,
      paused: config.paused,
      defaults: { ease: "none" },
      onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
    }),
    length = items.length,
    startX = items[0].offsetLeft,
    times = [],
    widths = [],
    xPercents = [],
    curIndex = 0,
    pixelsPerSecond = (config.speed || 1) * 100,
    snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1),
    populateWidths = () =>
      items.forEach((el, i) => {
        widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
        xPercents[i] = snap(
          (parseFloat(gsap.getProperty(el, "x", "px")) / widths[i]) * 100 +
            gsap.getProperty(el, "xPercent")
        );
      }),
    getTotalWidth = () => {
      // Add extra 1.5rem (24px) spacing at the loop seam
      const extraSpacing = 24; // 1.5rem in px
      return (
        items[length - 1].offsetLeft +
        (xPercents[length - 1] / 100) * widths[length - 1] -
        startX +
        items[length - 1].offsetWidth *
          gsap.getProperty(items[length - 1], "scaleX") +
        (parseFloat(config.paddingRight) || 0) +
        extraSpacing
      );
    },
    totalWidth,
    curX,
    distanceToStart,
    distanceToLoop,
    item,
    i;
  populateWidths();
  gsap.set(items, {
    xPercent: (i) => xPercents[i],
  });
  gsap.set(items, { x: 0 });
  totalWidth = getTotalWidth();
  for (i = 0; i < length; i++) {
    item = items[i];
    curX = (xPercents[i] / 100) * widths[i];
    distanceToStart = item.offsetLeft + curX - startX;
    // Subtract threshold so the wrap happens before the edge
    distanceToLoop =
      distanceToStart +
      widths[i] * gsap.getProperty(item, "scaleX") -
      threshold;
    tl.to(
      item,
      {
        xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
        duration: distanceToLoop / pixelsPerSecond,
      },
      0
    )
      .fromTo(
        item,
        {
          xPercent: snap(
            ((curX - distanceToLoop + totalWidth) / widths[i]) * 100
          ),
        },
        {
          xPercent: xPercents[i],
          duration:
            (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
          immediateRender: false,
        },
        distanceToLoop / pixelsPerSecond
      )
      .add("label" + i, distanceToStart / pixelsPerSecond);
    times[i] = distanceToStart / pixelsPerSecond;
  }
  function toIndex(index, vars) {
    vars = vars || {};
    Math.abs(index - curIndex) > length / 2 &&
      (index += index > curIndex ? -length : length);
    let newIndex = gsap.utils.wrap(0, length, index),
      time = times[newIndex];
    if (time > tl.time() !== index > curIndex) {
      vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
      time += tl.duration() * (index > curIndex ? 1 : -1);
    }
    curIndex = newIndex;
    vars.overwrite = true;
    return tl.tweenTo(time, vars);
  }
  tl.next = (vars) => toIndex(curIndex + 1, vars);
  tl.previous = (vars) => toIndex(curIndex - 1, vars);
  tl.current = () => curIndex;
  tl.toIndex = (index, vars) => toIndex(index, vars);
  tl.updateIndex = () =>
    (curIndex = Math.round(tl.progress() * (items.length - 1)));
  tl.times = times;
  tl.progress(1, true).progress(0, true);
  if (config.reversed) {
    tl.vars.onReverseComplete();
    tl.reverse();
  }

  return tl;
}

// Pause news ticker animations for a specific component or all components
export function pauseNewsTickerAnimation(componentName) {
  if (window.__capellaNewsTickerTimelines) {
    if (componentName) {
      // Pause specific component
      if (window.__capellaNewsTickerTimelines[componentName]) {
        window.__capellaNewsTickerTimelines[componentName].forEach((tl) => {
          if (tl && tl.pause) tl.pause();
        });
      }
    } else {
      // Pause all components
      Object.values(window.__capellaNewsTickerTimelines).forEach(
        (componentTimelines) => {
          componentTimelines.forEach((tl) => {
            if (tl && tl.pause) tl.pause();
          });
        }
      );
    }
  }
}

// Resume news ticker animations for a specific component or all components
export function resumeNewsTickerAnimation(componentName) {
  if (window.__capellaNewsTickerTimelines) {
    if (componentName) {
      // Resume specific component
      if (window.__capellaNewsTickerTimelines[componentName]) {
        window.__capellaNewsTickerTimelines[componentName].forEach((tl) => {
          if (tl && tl.play) {
            setTimeout(() => {
              tl.play();
              gsap.to(tl, { timeScale: 1, overwrite: true });
            }, 0);
          }
        });
      }
    } else {
      // Resume all components
      Object.values(window.__capellaNewsTickerTimelines).forEach(
        (componentTimelines) => {
          componentTimelines.forEach((tl) => {
            if (tl && tl.play) {
              setTimeout(() => {
                tl.play();
                gsap.to(tl, { timeScale: 1, overwrite: true });
              }, 0);
            }
          });
        }
      );
    }
  }
}

// Kill and remove news ticker animations for a specific component or all components
export function killNewsTickerAnimation(
  componentName,
  containerSelector = ".cards"
) {
  if (window.__capellaNewsTickerTimelines) {
    if (componentName) {
      // Kill specific component
      if (window.__capellaNewsTickerTimelines[componentName]) {
        window.__capellaNewsTickerTimelines[componentName].forEach((tl) => {
          if (tl && tl.kill) tl.kill();
        });
        window.__capellaNewsTickerTimelines[componentName].length = 0;
      }

      // Remove transforms and event listeners only for the specific component
      const tickerLines = document.querySelectorAll(containerSelector);
      tickerLines.forEach((line) => {
        // Only clean up if this element belongs to the specified component
        if (line._componentName === componentName) {
          cleanupTickerElement(line);
        }
      });
    } else {
      // Kill all components
      Object.keys(window.__capellaNewsTickerTimelines).forEach((key) => {
        window.__capellaNewsTickerTimelines[key].forEach((tl) => {
          if (tl && tl.kill) tl.kill();
        });
        window.__capellaNewsTickerTimelines[key].length = 0;
      });

      // Remove all transforms and x/xPercent styles from all ticker elements
      const tickerLines = document.querySelectorAll(containerSelector);
      tickerLines.forEach((line) => {
        cleanupTickerElement(line);
      });
    }
  }
}

// Helper function to clean up ticker element
function cleanupTickerElement(line) {
  // Remove event listeners if present
  if (line._gsapTickerWheelHandler) {
    line.removeEventListener("wheel", line._gsapTickerWheelHandler, {
      passive: false,
    });
    delete line._gsapTickerWheelHandler;
  }
  if (line._gsapTickerTouchStartHandler) {
    line.removeEventListener("touchstart", line._gsapTickerTouchStartHandler);
    delete line._gsapTickerTouchStartHandler;
  }
  if (line._gsapTickerTouchMoveHandler) {
    line.removeEventListener("touchmove", line._gsapTickerTouchMoveHandler);
    delete line._gsapTickerTouchMoveHandler;
  }
  if (line._gsapTickerTouchEndHandler) {
    line.removeEventListener("touchend", line._gsapTickerTouchEndHandler);
    delete line._gsapTickerTouchEndHandler;
  }

  // Clean up component identifier
  delete line._componentName;

  line.style.transform = "";
  line.style.webkitTransform = "";
  // Remove GSAP inline styles from children
  line.querySelectorAll("li").forEach((card) => {
    card.style.transform = "";
    card.style.webkitTransform = "";
    card.style.x = "";
    card.style.xPercent = "";
  });
}

/* --------------------------- Mobile Book Button --------------------------- */
async function createMobileBookButton() {
  const siteMatch = ["osaka", "maldives"].find((site) =>
    window.location.href.includes(site)
  );
  const isPropertySites = !!siteMatch;
  const isExceptionPage = ["reserve-hub", "gha-discovery"].some((page) =>
    window.location.href.includes(page)
  );

  if (isExceptionPage) return;

  let bookText = "Book";
  try {
    bookText = placeholders.generalBook || "Book";
  } catch (error) {
    console.error("Error fetching placeholders:", error);
  }

  const ctaBookButton = document.createElement("div");
  ctaBookButton.className = "cta-book-button-mobile";

  if (isPropertySites) {
    const currentLanguage = getLanguage();
    const { currency, locale } = getCurrencyAndLocale(currentLanguage);
    const { hotel, chain } = getHotelConfig(siteMatch);

    ctaBookButton.innerHTML = `<a type="button" target="_blank" href="https://be.synxis.com/?&chain=${chain}&currency=${currency}&hotel=${hotel}&level=hotel&locale=${locale}&productcurrency=${currency}" class="cta-button-mobile">${bookText}</a>`;

  } else {
    ctaBookButton.innerHTML = `<a type="button" href="reserveModal" class="cta-button-mobile">${bookText}</a>`;
  }

  document.body.appendChild(ctaBookButton);

  // Setup event listeners for mobile button functionality
  // const mobileBar = document.querySelector(".hero-reserve-bar-mobile");
  // const ctaBtnMobile = document.querySelector(".cta-button-mobile");

  // If on brand, open another overlay to choose property first

  // if (mobileBar && ctaBtnMobile && isPropertySites) {
  //   ctaBtnMobile.addEventListener("click", () => {
  //     mobileBar.classList.toggle("open");
  //     if (mobileBar.classList.contains("open")) {
  //       document.body.classList.add("modal-open");
  //       document.body.classList.add("reserve-bar-mobile-open");
  //       document.body.style.overflow = "hidden";
  //       document.documentElement.style.overflow = "hidden";
  //     } else {
  //       document.body.classList.remove("modal-open");
  //       document.body.classList.remove("reserve-bar-mobile-open");
  //       document.body.style.overflow = "";
  //       document.documentElement.style.overflow = "";
  //     }
  //   });

  //   // Handle window resize to close mobile bar on desktop
  //   window.addEventListener("resize", () => {
  //     if (window.innerWidth > 768 && mobileBar.classList.contains("open")) {
  //       mobileBar.classList.remove("open");
  //       document.body.classList.remove("modal-open");
  //       document.body.classList.remove("reserve-bar-mobile-open");
  //       document.body.style.overflow = "";
  //       document.documentElement.style.overflow = "";
  //     }
  //   });

  //   // Handle close button click
  //   const closeBtn = mobileBar.querySelector(".close-mobile-bar");
  //   if (closeBtn) {
  //     closeBtn.addEventListener("click", () => {
  //       mobileBar.classList.remove("open");
  //       document.body.classList.remove("modal-open");
  //       document.body.classList.remove("reserve-bar-mobile-open");
  //       document.body.style.overflow = "";
  //       document.documentElement.style.overflow = "";
  //     });
  //   }
  // }

  // Setup reservation bar functionality
  // setupReservationBar(document);
}

setTimeout(createMobileBookButton, 500);

/* ------------------ Fade in videos and images when loaded ----------------- */

// function imageLoaded(imgs = document.querySelectorAll("img.lazy")) {
//   imgs.forEach((img) => {
//     function markLoaded() {
//       img.classList.add("loaded");
//     }

//     // Attach load listener
//     img.addEventListener("load", markLoaded, { once: true });

//     // Fallback for cached images
//     if (img.complete && img.naturalWidth > 0) {
//       markLoaded();
//     }
//   });
// }
// // Initial images
// setTimeout(() => imageLoaded(), 1000); // Optional delay for DOM ready

// // Observe dynamically added images
// const observer = new MutationObserver((mutations) => {
//   mutations.forEach((mutation) => {
//     mutation.addedNodes.forEach((node) => {
//       // Only handle img elements with .lazy
//       if (node.nodeType === 1 && node.matches("img.lazy")) {
//         imageLoaded([node]);
//       }

//       // Also check descendants (like images inside injected containers)
//       if (node.nodeType === 1) {
//         const imgs = node.querySelectorAll("img.lazy");
//         if (imgs.length) imageLoaded(imgs);
//       }
//     });
//   });
// });

// // Start observing the document body
// observer.observe(document.body, { childList: true, subtree: true });

// function videoLoaded(videos = document.querySelectorAll("video.eager")) {
//   videos.forEach((video) => {
//     function markLoaded() {
//       video.classList.add("loaded");
//     }

//     // Attach loadeddata listener
//     video.addEventListener("loadeddata", markLoaded, { once: true });

//     // Fallback for already loaded videos
//     if (video.readyState >= 2) {
//       markLoaded();
//     }
//   });
// }

// // Initial videos
// setTimeout(() => videoLoaded(), 1000);

// // Observe dynamically added videos
// const videoObserver = new MutationObserver((mutations) => {
//   mutations.forEach((mutation) => {
//     mutation.addedNodes.forEach((node) => {
//       // Only handle video elements with .eager
//       if (node.nodeType === 1 && node.matches("video.eager")) {
//         videoLoaded([node]);
//       }

//       // Also check descendants
//       if (node.nodeType === 1) {
//         const videos = node.querySelectorAll("video.eager");
//         if (videos.length) videoLoaded(videos);
//       }
//     });
//   });
// });

// videoObserver.observe(document.body, { childList: true, subtree: true });

/* ----------------------- Currency, Locale, Hotel Config ---------------------- */

// Currency and locale mapping
export function getCurrencyAndLocale(lang) {
  const settings = {
    zh: { currency: "CNY", locale: "zh-CN" },
    "zh-CN": { currency: "CNY", locale: "zh-CN" },
    ja: { currency: "JPY", locale: "ja-JP" },
    "ja-JP": { currency: "JPY", locale: "ja-JP" },
    de: { currency: "EUR", locale: "de-DE" },
    "de-DE": { currency: "EUR", locale: "de-DE" },
    ko: { currency: "KRW", locale: "ko-KR" },
    "ko-KR": { currency: "KRW", locale: "ko-KR" },
    // Default fallback
    en: { currency: "USD", locale: "en-US" },
    "en-US": { currency: "USD", locale: "en-US" },
  };

  return settings[lang] || settings["en"];
}

// Hotel configuration mapping
export function getHotelConfig(location) {
  const hotelConfigs = {
    osaka: {
      hotel: "48036",
      chain: "21430",
    },
    maldives: {
      hotel: "31794",
      chain: "5154",
    },
  };

  return hotelConfigs[location] || hotelConfigs["maldives"];
}

/**
 * Gets the current document language for locale formatting
 * @returns {string} The locale code (e.g., 'en-US', 'fr-FR', 'ja-JP')
 */
export function getDocumentLocale() {
  const lang = getLanguage();

  // Map language codes to full locale codes for better date formatting
  const localeMap = {
    en: "en-US",
    de: "de-DE",
    ja: "ja-JP",
    ko: "ko-KR",
    zh: "zh-CN",
  };

  return localeMap[lang] || lang;
}

export function getLocalizedDayNames() {
  const locale = getDocumentLocale();
  const days = [];

  // Create a date that starts on Monday (2024-01-01 was a Monday)
  const baseDate = new Date(2024, 0, 1); // January 1, 2024 (Monday)

  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    const dayName = date.toLocaleDateString(locale, { weekday: "short" });
    days.push(dayName);
  }

  return days;
}

/* ------------------- Render Region specific text content ------------------ */
export function fetchCurrentRegion(successCallback) {
  if (window.adobe && window.adobe.target) {
    adobe.target.getOffer({
      mbox: "newsletter_modal_mbox",
      params: {},
      success: function (offer) {
        if (offer && offer.content) {
          let regionVal = offer[0]?.content || "EN";
          try {
            regionVal =
              typeof regionVal === "string" ? JSON.parse(regionVal) : regionVal;
          } catch {}
          const region = regionVal[0].code || "EN";
          successCallback(region);
        }
      },
      error: function (err) {
        console.warn("Target modal getOffer error", err);
      },
    });
  }
}

/* ----------------------- String Conversion ---------------------- */
// Helper to convert kebab-case to "Kebab case"
export function kebabToNormal(str) {
  if (!str) return "";

  const custom = {
    "body-mind-soul": "Body, Mind and Soul",
    "culture-craft": "Culture & Craft",
  };
  if (custom[str]) return custom[str];

  return str
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalToKebab(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

export function isExternalLink(url) {
  return url && !url.startsWith("/") && !url.startsWith("#");
}
