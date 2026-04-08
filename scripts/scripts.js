import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
  isUniversalEditor,
  sampleRUM,
} from "./aem.js";
import { initTextSplitAnimation, initStaggerAnimations } from "./animations.js";
import {
  showFieldError,
  clearAllErrors,
  addFieldErrorListeners,
  populateCountrySelect,
  preloadCountries,
} from "../blocks/newsletter-modal/newsletter-modal-utils.js";
import {
  formatRichText,
  getElements,
  getBasePathBasedOnEnv,
  fetchPlaceholders,
} from "./utils.js";

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter(
        (attr) =>
          attr.startsWith("data-aue-") || attr.startsWith("data-richtext-")
      )
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes("localhost"))
      sessionStorage.setItem("fonts-loaded", "true");
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Auto Blocking failed", error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  // buildAutoBlocks();
  decorateSections(main);
  decorateBlocks(main);
}

// AT - START
function initATJS(path, config) {
  window.targetGlobalSettings = config;
  return new Promise((resolve) => {
    import(path).then(resolve);
  });
}

function onDecoratedElement(fn) {
  // Apply propositions to all already decorated blocks/sections
  if (
    document.querySelector(
      '[data-block-status="loaded"],[data-section-status="loaded"]'
    )
  ) {
    fn();
  }

  const observer = new MutationObserver((mutations) => {
    if (
      mutations.some(
        (m) =>
          m.target.tagName === "BODY" ||
          m.target.dataset.sectionStatus === "loaded" ||
          m.target.dataset.blockStatus === "loaded"
      )
    ) {
      fn();
    }
  });
  // Watch sections and blocks being decorated async
  observer.observe(document.querySelector("main"), {
    subtree: true,
    attributes: true,
    attributeFilter: ["data-block-status", "data-section-status"],
  });
  // Watch anything else added to the body
  observer.observe(document.querySelector("body"), { childList: true });
}

function toCssSelector(selector) {
  return selector.replace(
    /(\.\S+)?:eq\((\d+)\)/g,
    (_, clss, i) => `:nth-child(${Number(i) + 1}${clss ? ` of ${clss})` : ""}`
  );
}

async function getElementForOffer(offer) {
  const selector = offer.cssSelector || toCssSelector(offer.selector);
  return document.querySelector(selector);
}

async function getElementForMetric(metric) {
  const selector = toCssSelector(metric.selector);
  return document.querySelector(selector);
}

async function getAndApplyOffers() {
  const response = await window.adobe.target.getOffers({
    request: { execute: { pageLoad: {} } },
  });
  const { options = [], metrics = [] } = response.execute.pageLoad;
  onDecoratedElement(() => {
    window.adobe.target.applyOffers({ response });
    // keeping track of offers that were already applied
    options.forEach(
      (o) => (o.content = o.content.filter((c) => !getElementForOffer(c)))
    );
    // keeping track of metrics that were already applied
    metrics
      .map((m, i) => (getElementForMetric(m) ? i : -1))
      .filter((i) => i >= 0)
      .reverse()
      .map((i) => metrics.splice(i, 1));
  });
}

let atjsPromise = Promise.resolve();
if (getMetadata("target")) {
  atjsPromise = initATJS("./at.js", {
    clientCode: "capellahotelgroup",
    serverDomain: "capellahotelgroup.tt.omtrdc.net",
    imsOrgId: "1B101ED4679CC37C0A495C44@AdobeOrg",
    bodyHidingEnabled: false,
    cookieDomain: window.location.hostname,
    pageLoadEnabled: false,
    secureOnly: true,
    viewsEnabled: false,
    withWebGLRenderer: false,
  });
  document.addEventListener("at-library-loaded", () => getAndApplyOffers());
  document.addEventListener("at-request-succeeded", function (e) {});
}
// AT - END

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = document.documentElement.lang || "en";
  decorateTemplateAndTheme();
  const main = doc.querySelector("main");
  if (main) {
    decorateMain(main);
    await atjsPromise;
    await new Promise((resolve) => {
      window.setTimeout(async () => {
        document.body.classList.add("appear");
        await loadSection(main.querySelector(".section"), waitForFirstImage);
        resolve();
      }, 0);
    });
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem("fonts-loaded")) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

async function loadErrorPage(main) {
  if (window.errorCode === "404") {
    const path = window.location.pathname;
    let response;
    let langCode = "en";

    if (path.includes("/osaka/")) {
      if (path.includes("/ja/")) {
        response = await fetch("/osaka/ja/404.plain.html");
        langCode = "ja";
      } else if (path.includes("/zh/")) {
        response = await fetch("/osaka/zh/404.plain.html");
        langCode = "zh";
      } else if (path.includes("/ko/")) {
        response = await fetch("/osaka/ko/404.plain.html");
        langCode = "ko";
      } else {
        response = await fetch("/osaka/404.plain.html");
      }
    } else if (path.includes("/maldives/")) {
      if (path.includes("/zh/")) {
        response = await fetch("/maldives/zh/404.plain.html");
        langCode = "zh";
      } else if (path.includes("/ja/")) {
        response = await fetch("/maldives/ja/404.plain.html");
        langCode = "ja";
      } else if (path.includes("/de/")) {
        response = await fetch("/maldives/de/404.plain.html");
        langCode = "de";
      } else {
        response = await fetch("/maldives/404.plain.html");
      }
    } else {
      if (path.includes("/zh/")) {
        response = await fetch("/zh/404.plain.html");
        langCode = "zh";
      } else if (path.includes("/ko/")) {
        response = await fetch("/ko/404.plain.html");
        langCode = "ko";
      } else if (path.includes("/ja/")) {
        response = await fetch("/ja/404.plain.html");
        langCode = "ja";
      } else {
        response = await fetch("/404.plain.html");
      }
    }

    // Override the HTML lang attribute
    document.documentElement.lang = langCode;

    // Store language code in localStorage
    localStorage.setItem("langCode", langCode);

    main.innerHTML = `
      <div class="hero-container"></div>
      <div class="header-container"></div>
      <div class="promo-container"></div>
      <div class="two-columns-container"></div>
      <div class="slider-teaser-container"></div>
    `;

    if (response && response.ok) {
      const htmlContent = await response.text();
      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = htmlContent;

      const injectComponent = (sourceClass, targetContainer) => {
        const element = tempContainer.querySelector(sourceClass);
        const target = main.querySelector(targetContainer);
        if (element && target) {
          target.appendChild(element.cloneNode(true));
        }
      };

      injectComponent(".hero", ".hero-container");
      injectComponent(".section-header", ".header-container");
      injectComponent(".promo-container", ".promo-container");
      injectComponent(".two-columns-container", ".two-columns-container");
      injectComponent(".slider-teaser-content", ".slider-teaser-container");
    }

    document.documentElement.style.setProperty("--page-type", "error");
    main.classList.add("error-page");
    main.style.display = "block";

    decorateSections(main);
    decorateBlocks(main);

    await Promise.all([
      loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`),
      loadFonts(),
    ]);

    await loadSections(main);

    setTimeout(() => {
      document.body.style.visibility = "visible";
    }, 100);
  }
}

async function loadLazy(doc) {
  const main = doc.querySelector("main");
  if (main.tagName === "MAIN" && main.classList.contains("error")) {
    await loadErrorPage(main);

    const { hash } = window.location;
    const element = hash ? doc.getElementById(hash.substring(1)) : false;
    if (hash && element) element.scrollIntoView();

    loadHeader(doc.querySelector("header"));
    loadFooter(doc.querySelector("footer"));

    loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
    loadFonts();
  } else {
    loadSections(main);

    const { hash } = window.location;
    const element = hash ? doc.getElementById(hash.substring(1)) : false;
    if (hash && element) element.scrollIntoView();

    loadHeader(doc.querySelector("header"));
    loadFooter(doc.querySelector("footer"));

    loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
    loadFonts();

    sampleRUM("lazy");
    if (typeof sampleRUM.observe === "function") {
      sampleRUM.observe(main.querySelectorAll("div[data-block-name]"));
      sampleRUM.observe(main.querySelectorAll("picture > img"));
    }
  }
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import("./delayed.js"), 3000);
  // load anything that can be postponed to the latest here
}

// Newsletter Modal Global Component
const NewsletterModal = {
  API_ENDPOINT: getBasePathBasedOnEnv() + "/bin/chg/newsletter.json",
  RECAPTCHA_SITE_KEY: "6LfpYh8rAAAAAPaE-icNeXk4b8ktPXqLKwHhqp6d",
  BLOCK_CLASS_NAME: "newsletter-modal",
  TEST_SUCCESS: false, // Set to true to test success page without API
  salutationsSelection: ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."],

  isOpen: false,
  isSuccess: false,
  modalBlock: null,
  newsletterModalContainer: null,
  placeholders: {},
  captchaWidgetId: null,

  async init() {
    await this.loadPlaceholders();

    // Initialize the newsletter modal container if it doesn't exist
    this.newsletterModalContainer = document.querySelector(
      ".newsletter-modal-container"
    );
    if (!this.newsletterModalContainer) {
      this.newsletterModalContainer = document.createElement("div");
      this.newsletterModalContainer.className = "newsletter-modal-container";
      this.newsletterModalContainer.style.visibility = "hidden";
      this.newsletterModalContainer.style.position = "fixed";
      this.newsletterModalContainer.style.opacity = "0";
      this.newsletterModalContainer.style.top = "0";
      this.newsletterModalContainer.style.left = "0";
      this.newsletterModalContainer.style.width = "100%";
      this.newsletterModalContainer.style.height = "100%";
      this.newsletterModalContainer.style.zIndex = "-9999";
      this.newsletterModalContainer.style.justifyContent = "center";
      this.newsletterModalContainer.style.alignItems = "center";
      document.body.appendChild(this.newsletterModalContainer);
    }

    // Add global event listeners for newsletter links
    this.addGlobalEventListeners();

    // Preload countries data immediately for better UX
    preloadCountries().catch((err) => {
      console.warn("Failed to preload countries:", err);
    });
  },

  async loadPlaceholders() {
    try {
      this.placeholders = await fetchPlaceholders();
    } catch (error) {
      console.error("Failed to load placeholders:", error);
      this.placeholders = {};
    }
  },

  getPlaceholder(key) {
    return this.placeholders[key] || "";
  },

  addGlobalEventListeners() {
    // Use event delegation for newsletter links
    document.addEventListener("click", (e) => {
      if (
        e.target.matches('a[href*="/newsletter"]') ||
        e.target.closest('a[href*="/newsletter"]')
      ) {
        e.preventDefault();
        if (e.srcElement.textContent.toLowerCase() === "be in the know") {
          //TODO INTERIM - Open newsletter in the dialog that is clicked for carousel slide in imprints
          const slide = e.target.closest(".swiper-slide-active");
          // Append the modal container to the slide so it appears within the clicked carousel slide
          if (slide && !slide.contains(this.newsletterModalContainer)) {
            slide.appendChild(this.newsletterModalContainer);
            this.openModal();
          }
        } else {
          if (this.newsletterModalContainer.parentNode !== document.body) {
            document.body.appendChild(this.newsletterModalContainer);
          }
        }
        this.openModal();
      }
    });
  },

  openModal() {
    if (!this.modalBlock) {
      console.warn("Newsletter modal block not initialized");
      return;
    }

    this.isOpen = true;
    this.isSuccess = false;
    this.newsletterModalContainer.style.visibility = "visible";
    this.newsletterModalContainer.style.zIndex = "9999";
    this.newsletterModalContainer.style.opacity = "1";
    this.renderNewsletterModal(this.modalBlock);
  },

  closeModal() {
    if (
      this.newsletterModalContainer &&
      this.newsletterModalContainer.parentNode !== document.body
    ) {
      document.body.appendChild(this.newsletterModalContainer);
    }
    this.isOpen = false;
    this.isSuccess = false;
    if (this.newsletterModalContainer) {
      this.newsletterModalContainer.style.visibility = "hidden";
      this.newsletterModalContainer.style.zIndex = "-9999";
      this.newsletterModalContainer.style.opacity = "0";
    }
    if (this.modalBlock) {
      this.renderNewsletterModal(this.modalBlock);
    }
  },

  setModalBlock(block) {
    this.modalBlock = block;
    if (!this.newsletterModalContainer.contains(block.parentElement)) {
      // Create wrapper if needed
      const wrapper = document.createElement("div");
      wrapper.appendChild(block);
      this.newsletterModalContainer.appendChild(wrapper);
    }
  },

  renderNewsletterModal(block) {
    if (!this.isOpen) {
      block.style.opacity = "0";
      const overlay =
        block.parentElement?.parentElement || this.newsletterModalContainer;
      if (overlay) {
        overlay.style.background = "transparent";
        overlay.style.pointerEvents = "none";
        overlay.removeEventListener(
          "click",
          overlay._newsletterModalClickHandler
        );
        overlay._newsletterModalClickHandler = null;
      }
      return;
    }

    block.style.opacity = "1";
    const overlay =
      block.parentElement?.parentElement || this.newsletterModalContainer;
    if (overlay) {
      overlay.style.background = "rgba(0, 0, 0, 0.8)";
      overlay.style.pointerEvents = "auto";
      if (!overlay._newsletterModalClickHandler) {
        overlay._newsletterModalClickHandler = (e) => {
          if (e.target === overlay) {
            this.closeModal();
          }
        };
        overlay.addEventListener("click", overlay._newsletterModalClickHandler);
      }
    }

    // Get modal content from block (cache on first render)
    if (!block._cachedContent) {
      const selectors = [
        {
          key: "headerText",
          sel: `.${this.BLOCK_CLASS_NAME} > div:nth-child(1) > div`,
        },
        {
          key: "buttonText",
          sel: `.${this.BLOCK_CLASS_NAME} > div:nth-child(2) > div > p`,
        },
        {
          key: "termsText",
          sel: `.${this.BLOCK_CLASS_NAME} > div:nth-child(3) > div`,
        },
        {
          key: "image",
          sel: `.${this.BLOCK_CLASS_NAME} > div:nth-child(4) > div`,
        },
        {
          key: "successHeaderText",
          sel: `.${this.BLOCK_CLASS_NAME} > div:nth-child(5) > div `,
        },
        {
          key: "successDescriptionText",
          sel: `.${this.BLOCK_CLASS_NAME} > div:nth-child(6) > div > p`,
        },
        {
          key: "closeButtonText",
          sel: `.${this.BLOCK_CLASS_NAME} > div:nth-child(7) > div > p`,
        },
      ];

      const elements = getElements(block, selectors);

      if (window.adobe && window.adobe.target) {
        adobe.target.getOffer({
          mbox: "newsletter_modal_mbox",
          params: {
            // optional: custom param you want to pass
          },
          success: function (offer) {
            let regionVal = offer[0]?.content || "EN";
            try {
              regionVal =
                typeof regionVal === "string"
                  ? JSON.parse(regionVal)
                  : regionVal;
            } catch {}
            const region = regionVal[0].code || "EN";
            // Extract region-specific terms from the <ul>
            const termsDiv = elements.termsText[0];
            if (termsDiv) {
              const ul = termsDiv.querySelector("ul");
              if (ul) {
                // Find the <li> that matches the region (case-insensitive)
                let regionKey = region.toLowerCase();
                let matchedLi = Array.from(ul.children).find((li) => {
                  const text = li.textContent.toLowerCase();
                  if (regionKey === "en") {
                    // Default: no region prefix or starts with "en:"
                    return (
                      !text.includes(":") ||
                      text.startsWith("en:") ||
                      text.startsWith("en :")
                    );
                  }
                  return text.startsWith(regionKey + ":");
                });
                // If not found, fallback to first <li>
                if (!matchedLi) matchedLi = ul.children[0];
                // Remove all <li> except the matched one
                Array.from(ul.children).forEach((li) => {
                  if (li !== matchedLi) li.remove();
                });
                // Remove region prefix from the matched <li> if present
                if (
                  matchedLi &&
                  matchedLi.firstChild &&
                  matchedLi.firstChild.nodeType === Node.TEXT_NODE
                ) {
                  matchedLi.firstChild.textContent =
                    matchedLi.firstChild.textContent.replace(/^\s*\w+\s*:/, "");
                }
              }
            }

            const termsText = block
              .querySelector(".terms-text")
              .querySelector("p");
            if (termsText) {
              termsText.innerHTML = termsDiv.querySelector("li").innerHTML;
              sessionStorage.setItem(
                "newsletter_terms",
                termsDiv.querySelector("li").innerHTML
              );
            }
          },
          error: function (err) {
            console.warn("Target modal getOffer error", err);
          },
        });
      }

      // Header text formatting
      formatRichText(elements.headerText[0], "modal-header");
      // Terms text formatting
      formatRichText(
        elements.termsText[0],
        "desc terms-text text-text-black-800",
        "text-p3"
      );
      // Success header text formatting
      formatRichText(elements.successHeaderText[0], "modal-header");

      // Use placeholders for default content
      block._cachedContent = {
        headerHTML: elements.headerText[0]?.innerText
          ? elements.headerText[0]?.innerHTML.trim()
          : `<div class="modal-header"><p class="text-p1 text-p split-text">${this.getPlaceholder(
              "newsletterTitle"
            )}</p></div>`,
        buttonText:
          elements.buttonText[0]?.textContent.trim() ||
          this.getPlaceholder("newsletterContinue"),
        termsHTML: `<div class="desc terms-text text-text-black-800"><p class="text-p1 text-p split-text text-p3"></p></div>`,
        imageHTML: elements.image[0]?.innerHTML || "",
        successHeaderHTML: elements.successHeaderText[0]?.innerText
          ? elements.successHeaderText[0]?.innerHTML.trim()
          : `<div class="modal-header"><p class="text-p1 text-p split-text">${this.getPlaceholder(
              "newsletterSuccessTitle"
            )}</p></div>`,
        successDescText:
          elements.successDescriptionText[0]?.textContent.trim() ||
          this.getPlaceholder("newsletterSuccessDesc"),
        closeButtonText:
          elements.closeButtonText[0]?.textContent.trim() ||
          this.getPlaceholder("newsletterSuccessClose"),
      };
    }

    const cached = block._cachedContent;

    // if (
    //   !window.location.href.toLowerCase().includes("maldives") &&
    //   !window.location.href.toLowerCase().includes("osaka")
    // ) {
    //   console.log("cached image", cached.imageHTML);
    //   console.log("cached image src", typeof cached.imageHTML);

    //   // Create a temporary DOM element from the HTML string
    //   const tempDiv = document.createElement("div");
    //   tempDiv.innerHTML = cached.imageHTML;

    //   // Look for anchor tags with href attributes (links to images) and replace with img tags
    //   const imageLinks = tempDiv.querySelectorAll("a[href]");

    //   imageLinks.forEach((link) => {
    //     const currentHref = link.getAttribute("href");
    //     if (currentHref) {
    //       const newUrl = getBasePathBasedOnEnv() + currentHref;
    //       console.log("new url", newUrl);

    //       // Create an img element to replace the anchor tag
    //       const imgElement = document.createElement("img");
    //       imgElement.setAttribute("src", newUrl);
    //       imgElement.setAttribute(
    //         "alt",
    //         link.textContent.trim() || "Newsletter image"
    //       );

    //       // Copy any classes from the anchor to the img
    //       if (link.className) {
    //         imgElement.className = link.className;
    //       }

    //       // Replace the anchor tag with the img element
    //       link.parentNode.replaceChild(imgElement, link);
    //     }
    //   });

    //   // Also check for actual img elements (in case there are any)
    //   const img = tempDiv.querySelector("img");
    //   if (img) {
    //     const currentSrc = img.getAttribute("src");
    //     if (currentSrc && !currentSrc.startsWith(getBasePathBasedOnEnv())) {
    //       const newUrl = getBasePathBasedOnEnv() + currentSrc;
    //       img.setAttribute("src", newUrl);
    //     }
    //   }

    //   // Handle source elements for picture tags
    //   tempDiv.querySelectorAll("source").forEach((source) => {
    //     const currentSrcset = source.getAttribute("srcset");
    //     if (currentSrcset) {
    //       const newUrl = getBasePathBasedOnEnv() + currentSrcset;
    //       source.setAttribute("srcset", newUrl);
    //     }
    //   });

    //   // Update the cached HTML with the modified content
    //   cached.imageHTML = tempDiv.innerHTML;
    // }
    // Render modal HTML (both states, toggle with display)
    // Get newsletter_terms from sessionStorage if it exists
    let termsHTML = cached.termsHTML;
    const storedTerms = sessionStorage.getItem("newsletter_terms");
    if (storedTerms) {
      termsHTML = `<div class="desc terms-text text-text-black-800"><p class="text-p1 text-p split-text text-p3">${storedTerms}</p></div>`;
    }

    // Use placeholders for form field labels
    block.innerHTML = `
      <div class="success-${this.BLOCK_CLASS_NAME}" style="display: ${
      this.isSuccess ? "block" : "none"
    }; ">
      <button class="close-button" aria-label="Close" type="button"></button>
      <div class="image-container">${cached.imageHTML}</div>
      <div class="${this.BLOCK_CLASS_NAME}-success-header" ">
        ${cached.successHeaderHTML}
        <h5 class="text-h5 text-text-black-800" >${cached.successDescText}</h5>
        <button class="text-b cta-button text-close-button" aria-label="Close">${
          cached.closeButtonText
        }</button>
      </div>
      </div>
      <div class="default-${this.BLOCK_CLASS_NAME}" style="display: ${
      this.isSuccess ? "none" : "block"
    };">
      <button class="close-button" aria-label="Close" type="button"></button>
      <div class="${this.BLOCK_CLASS_NAME}-header">${cached.headerHTML}
        <form>
        <div class="relative">
          <div class="relative">
          <select name="salutation" class="pill-dropdown-button">
            <option value="">${this.getPlaceholder(
              "newsletterSalutation"
            )}*</option>
            ${this.salutationsSelection
              .map((s) => `<option value="${s}">${s}</option>`)
              .join("")}
          </select>
          </div>
          <div class="name-inputs">
          <div class="relative">
            <input class="pill-dropdown-button" placeholder="${this.getPlaceholder(
              "newsletterFirstname"
            )}*" type="text" value="" name="firstName">
          </div>
          <div class="relative">
            <input class="pill-dropdown-button" placeholder="${this.getPlaceholder(
              "newsletterLastname"
            )}*" type="text" value="" name="lastName">
          </div>
          </div>
          <div class="relative">
          <input class="pill-dropdown-button" placeholder="${this.getPlaceholder(
            "newsletterEmail"
          )}*" type="email" value="" name="email">
          </div>
          <div class="relative">
          <select name="country" class="pill-dropdown-button">
            <option value="">${this.getPlaceholder(
              "newsletterCountry"
            )}*</option>
          </select>
          </div>
          <div class="relative">
          <div id="html_element" name="captchaValue"></div>
          </div>
          <button class="text-b cta-button" type="submit">${
            cached.buttonText || this.getPlaceholder("newsletterContinue")
          }</button>
        </div>
        </form>
        ${termsHTML}
      </div>
      </div>
    `;
    block.style.display = "block";

    const successModal = block.querySelector(
      `.success-${this.BLOCK_CLASS_NAME}`
    );
    const defaultModal = block.querySelector(
      `.default-${this.BLOCK_CLASS_NAME}`
    );

    // Add close button event
    this.addCloseButtonHandler(block);

    // Optimized country select population - now uses cached data
    const countrySelect = block.querySelector('select[name="country"]');
    if (countrySelect) {
      // This will use cached data if available, or load and cache if not
      populateCountrySelect(countrySelect);
    }

    // Handle form submission
    this.addFormHandler(block, successModal, defaultModal);
  },

  addCloseButtonHandler(block) {
    const closeBtns = block.querySelectorAll('[aria-label="Close"]');
    closeBtns.forEach((closeBtn) => {
      closeBtn.addEventListener("click", () => this.closeModal());
    });
  },

  addFormHandler(block, successModal, defaultModal) {
    const form = block.querySelector("form");
    if (form) {
      addFieldErrorListeners(form, () => clearAllErrors(form));

      // Load reCAPTCHA if not already loaded
      if (typeof grecaptcha !== "undefined") {
        this.captchaWidgetId = grecaptcha.render("html_element", {
          sitekey: this.RECAPTCHA_SITE_KEY,
          theme: "light",
          size: "normal",
          tabindex: 0,
        });
      }

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector("button[type='submit']");
        const originalBtnContent = submitBtn ? submitBtn.innerHTML : null;
        if (submitBtn) {
          submitBtn.innerHTML =
            '<span class="button-loader" aria-label="Loading"></span>';
          submitBtn.disabled = true;
        }

        if (this.TEST_SUCCESS) {
          setTimeout(() => {
            this.isSuccess = true;
            if (defaultModal) defaultModal.style.display = "none";
            if (successModal) successModal.style.display = "block";
            if (submitBtn) {
              submitBtn.innerHTML = originalBtnContent;
              submitBtn.disabled = false;
            }
          }, 2000);
          return;
        }

        clearAllErrors(form);
        const formData = new FormData(form);
        const values = {
          salutation: formData.get("salutation"),
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          country: formData.get("country"),
        };

        let hasError = false;

        // Validate required fields
        if (!values.salutation) {
          showFieldError(
            form,
            "salutation",
            this.getPlaceholder("salutationValidation") ||
              "Please select your salutation"
          );
          hasError = true;
        }

        if (!values.firstName) {
          showFieldError(
            form,
            "firstName",
            this.getPlaceholder("firstNameValidation") ||
              "Please enter your first name"
          );
          hasError = true;
        }

        if (!values.lastName) {
          showFieldError(
            form,
            "lastName",
            this.getPlaceholder("lastNameValidation") ||
              "Please enter your last name"
          );
          hasError = true;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!values.email) {
          showFieldError(
            form,
            "email",
            this.getPlaceholder("emailValidation") ||
              "Please enter your email address"
          );
          hasError = true;
        } else if (!emailRegex.test(values.email)) {
          showFieldError(form, "email", "Please enter a valid email address");
          hasError = true;
        }

        if (!values.country) {
          showFieldError(
            form,
            "country",
            this.getPlaceholder("countryCodeValidation") ||
              "Please select your country"
          );
          hasError = true;
        }

        const captchaValue =
          typeof grecaptcha !== "undefined" && this.captchaWidgetId !== null
            ? grecaptcha.getResponse(this.captchaWidgetId)
            : "";
        if (!captchaValue) {
          showFieldError(
            form,
            "captchaValue",
            this.getPlaceholder("captchaValidation") ||
              "Please complete the reCAPTCHA verification"
          );
          hasError = true;
        }

        if (hasError) {
          if (submitBtn) {
            submitBtn.innerHTML = originalBtnContent;
            submitBtn.disabled = false;
          }
          return;
        }

        formData.append("captchaValue", captchaValue);
        formData.delete("g-recaptcha-response");

        fetch(this.API_ENDPOINT, {
          method: "POST",
          body: formData,
        })
          .then(async (res) => {
            if (!res.ok) throw new Error("Network response was not ok");
            const text = await res.text();
            if (!text) return {}; // treat empty as success
            try {
              return JSON.parse(text);
            } catch (e) {
              throw new Error("Invalid JSON response");
            }
          })
          .then((data) => {
            if (data.status === "success") {
              this.isSuccess = true;
              if (defaultModal) defaultModal.style.display = "none";
              if (successModal) successModal.style.display = "block";
            }
            if (submitBtn) {
              submitBtn.innerHTML = originalBtnContent;
              submitBtn.disabled = false;
            }
          })
          .catch((err) => {
            console.error("Newsletter signup error:", err);
            if (submitBtn) {
              submitBtn.innerHTML = originalBtnContent;
              submitBtn.disabled = false;
            }
          });
      });
    }
  },
};

function handleExternalLinks() {
  document.addEventListener("click", (e) => {
    const anchor = e.target.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href) return;

    // Check if the link is from a different domain - call once and store
    const isSameDomain = (url) => {
      // Handle relative URLs (they're always same domain)
      if (url.startsWith("/") || !url.includes("://")) return true;

      try {
        const linkUrl = new URL(url);
        const currentUrl = new URL(window.location.href);
        return linkUrl.hostname === currentUrl.hostname;
      } catch (e) {
        // If URL parsing fails, assume it's same domain
        return true;
      }
    };

    // Store the result to avoid multiple calls
    const sameDomain = isSameDomain(href);
    const hasTargetBlank = anchor.getAttribute("target") === "_blank";

    // Early return for external links
    if (!sameDomain) {
      if (!hasTargetBlank) {
        e.preventDefault();
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noopener noreferrer");
        window.open(href, "_blank");
      }
      return;
    }

    // From here, we know it's same domain - optimize further checks
    const hrefLower = href.toLowerCase();

    // Define exclude list - URLs that should NOT open in new window
    const excludeList = [
      "/reservemodal",
      "/newsletter",
      "/tnc",
      "/weddingenquiry",
      "/generalenquiry",
      "/eventsenquiry",
      "/restaurantenquiry",
      "/wellnessenquiry",
      "/profilecard",
      "/imprints",
      "/inclusions",
      "/sports-equipment",
      "/floorplanPopup",
      "/imageGallery",
    ];

    // Check if href contains any excluded URL (case-insensitive)
    const isExcluded = excludeList.some((excludedUrl) =>
      hrefLower.includes(excludedUrl)
    );

    // Early return for excluded URLs
    if (isExcluded && sameDomain) return;

    // Check if already has target="_blank"
    if (hasTargetBlank) return;

    // Check for document files
    const documentExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".csv",
      ".rtf",
      ".txt",
    ];
    const isDocumentFile = documentExtensions.some((ext) =>
      hrefLower.endsWith(ext)
    );

    // Handle document files
    if (isDocumentFile) {
      e.preventDefault();
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
      window.open(href, "_blank");
      return;
    }

    // Handle reserve-hub links
    if (hrefLower.includes("reserve-hub")) {
      e.preventDefault();
      anchor.setAttribute("target", "_blank");
      window.open(href, "_blank");
      return;
    }

    const currentUrl = window.location.href.toLowerCase();

    // Handle cross-property navigation within same domain
    const propertyPaths = ["/maldives", "/osaka", "/tianjin", "/sanya"];

    // Check which property the current URL belongs to
    const currentProperty = propertyPaths.find((property) =>
      currentUrl.includes(property)
    );

    // Check which property the href belongs to
    const hrefProperty = propertyPaths.find((property) =>
      hrefLower.includes(property)
    );

    // Check if cross-property navigation is needed
    const shouldOpenInNewWindow =
      (!currentProperty && hrefProperty) || // Main site to any property
      (currentProperty && !hrefProperty) || // Any property to main site
      (currentProperty && hrefProperty && currentProperty !== hrefProperty); // Between different properties
    if (shouldOpenInNewWindow) {
      e.preventDefault();
      anchor.setAttribute("target", "_blank");
      window.open(href, "_blank");
    }
  });
}

async function loadPage() {
  try {
    const placeholders = await fetchPlaceholders();
  } catch (error) {
    console.error("Error fetching placeholders:", error);
  }

  await loadEager(document);
  await loadLazy(document);
  NewsletterModal.init();
  window.NewsletterModal = NewsletterModal;
  handleExternalLinks();
  loadDelayed();
  initTextSplitAnimation();
  initStaggerAnimations();
}

loadPage();

export function getGhaProfile() {
  const token = localStorage.getItem("gha_token");
  const createdAt = localStorage.getItem("gha_token_created_at");
  let expired = false;
  if (createdAt) {
    const createdDate = new Date(createdAt);
    const now = new Date();
    expired = now - createdDate > 3600000; // 1 hour
  }
  if (!token || expired) {
    localStorage.removeItem("gha_token");
    localStorage.removeItem("gha_token_created_at");
    return false;
  }

  const apiUrl = getBasePathBasedOnEnv() + "/bin/chg/member/profile.json";

  return fetch(apiUrl, {
    method: "GET",
    headers: {
      "X-API-Key": token,
    },
  })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    })
    .catch(() => false);
}

// Flower splash screen logic
(() => {
  if (isUniversalEditor()) return;

  const splashContainer = document.querySelector(
    ".flower-splash-screen-container"
  );
  const header = document.querySelector("header");

  const hideElements = () => {
    // Set opacity 0 for all direct children of main except the splash container
    const main = document.querySelector("main");
    document.body.style.overflow = "hidden";
    [...main.children].forEach((child, idx) => {
      if (idx === 0) return;
      child.style.transition = "opacity 0.5s";
      child.style.opacity = "0";
    });
    header.style.transition = "opacity 0.5s";
    header.style.opacity = "0";
    const cookieDialog = document.querySelector(
      "body dialog.cookiefirst-root.notranslate > div"
    );
    if (cookieDialog) {
      cookieDialog.style.transition = "opacity 0.5s";
      cookieDialog.style.opacity = "0";
    }
  };

  if (splashContainer) hideElements();

  const showElements = () => {
    const main = document.querySelector("main");
    document.body.style.overflow = "";
    [...main.children].forEach((child) => {
      if (!child.classList.contains("flower-splash-screen-container")) {
        child.style.opacity = "1";
      }
    });
    header.style.opacity = "1";
    const cookieDialog = document.querySelector(
      "body dialog.cookiefirst-root.notranslate > div"
    );
    if (cookieDialog) {
      cookieDialog.style.opacity = "1";
    }
  };

  if (!splashContainer || localStorage.getItem("flowerSplashPlayed")) {
    setTimeout(showElements, 0);
  } else {
    function waitForSplashPlayed(startTime = Date.now()) {
      const isPlayed = localStorage.getItem("flowerSplashPlayed");
      const elapsed = Date.now() - startTime;
      if (isPlayed) {
        setTimeout(showElements, 1000);
      } else if (elapsed >= 3000) {
        showElements();
      } else {
        setTimeout(() => waitForSplashPlayed(startTime), 100);
      }
    }
    waitForSplashPlayed();
  }
})();

// //Initialize the external links handler when DOM is ready
// if (document.readyState === "loading") {
//   document.addEventListener("DOMContentLoaded", handleExternalLinks);
// } else {
//   handleExternalLinks();
// }

// // Initialize the newsletter modal when DOM is ready
// if (document.readyState === "loading") {
//   document.addEventListener("DOMContentLoaded", () => NewsletterModal.init());
// } else {
//   NewsletterModal.init();
// }
