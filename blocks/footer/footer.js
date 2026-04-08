import { loadFragment } from "../fragment/fragment.js";
import {
  processPrimarySection,
  processFooterSecondarySection,
  processFooterLegalLinksSection,
  processFooterSocialsSection,
  handleAuthoringEnv,
} from "./footer-utils.js";
import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import { handleAuthoringContentChange } from "../../scripts/utils.js";
import { supportedLangs, supportedSites } from "../../constants.js";

/**
 * Toggles an accordion panel open or closed using GSAP for smooth animation.
 * @param {HTMLElement} button The button that controls the accordion panel.
 */
function toggleAccordion(button) {
  const isOpen = button.getAttribute("aria-expanded") === "true";
  let toOpen = null;
  let toOpenIcon = null;

  // Close all accordions concurrently with GSAP (animate from current height to 0)
  document.querySelectorAll(".accordion-trigger").forEach((otherButton) => {
    const otherContent = otherButton.nextElementSibling;
    otherButton.setAttribute("aria-expanded", "false");
    if (otherContent && otherContent.classList.contains("accordion-content")) {
      otherContent.classList.remove("open");
      // Animate close from current height to 0
      const currentHeight = otherContent.scrollHeight;
      otherContent.style.overflow = "hidden";
      otherContent.style.height = currentHeight + "px";
      gsap.to(otherContent, {
        height: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          otherContent.style.removeProperty("height");
          otherContent.style.removeProperty("overflow");
        },
      });
    }
    otherButton.querySelector("svg").classList.remove("is-open");
    if (otherButton === button && !isOpen) {
      toOpen = otherContent;
      toOpenIcon = otherButton.querySelector("svg");
    }
  });

  // Open the clicked one after all others are closed
  if (toOpen) {
    button.setAttribute("aria-expanded", "true");
    toOpen.classList.add("open");
    // Animate open with GSAP
    toOpen.style.overflow = "hidden";
    toOpen.style.height = "0px";
    // Use a child wrapper for spacing
    const inner = toOpen.querySelector(".accordion-inner");
    let targetHeight = 0;
    if (inner) {
      targetHeight = inner.scrollHeight;
    } else {
      targetHeight = toOpen.scrollHeight;
    }
    gsap.to(toOpen, {
      height: targetHeight,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        toOpen.style.removeProperty("height");
        toOpen.style.removeProperty("overflow");
      },
    });
    toOpenIcon.classList.add("is-open");
  }
}

/**
 * Decorates the footer.
 * @param {HTMLElement} block The footer block element.
 */
export default async function decorate(block) {
  const prevUrl = document.referrer;
  const currentUrl = window.location.href.toLowerCase();

  if (isUniversalEditor()) {
    if (currentUrl.includes("/footer")) {
      loadCSS(`${window.hlx.codeBasePath}/blocks/footer/footer-author.css`);
      handleAuthoringEnv();
    }
    return;
  }

  if (currentUrl.includes("gha-discovery/profile")) {
    return;
  }

  const pathname = window.location.pathname.toLowerCase();
  const currentSite =
    supportedSites.find((site) =>
      pathname.match(new RegExp(`^/${site}(/|$)`))
    ) || "";
  let currentLang = "en";
  if (localStorage.getItem("langCode")) {
    currentLang = localStorage.getItem("langCode");
    localStorage.removeItem("langCode");
  } else {
    currentLang = document.documentElement.lang.toLowerCase();
  }
  function getFooterPath(site, lang) {
    const sitePath = site ? `/${site}` : "";
    const langPath = lang !== "en" ? `/${lang}` : "";
    return `${sitePath}${langPath}/footer`;
  }

  // Use previous site for imprints
  const previousSite =
    supportedSites.find((site) =>
      pathname.match(new RegExp(`^/${site}(/|$)`))
    ) || "";
  const usePrevSite =
    pathname.includes("imprints") && currentSite !== previousSite;
  const siteToUse = usePrevSite ? previousSite : currentSite;

  const footerPath = getFooterPath(siteToUse, currentLang);
  const fragment = await loadFragment(footerPath);
  const sections = fragment?.children;
  const [
    primarySection,
    secondarySection,
    copyrightSection,
    socialsSection,
    legalsSection,
  ] = sections;

  // Move floating widget to body
  const widgetBlock = Array.from(sections).find(
    (section) =>
      section.classList &&
      section.classList.contains("floating-widget-container")
  );
  if (widgetBlock)
    setTimeout(() => {
      document.body.appendChild(widgetBlock);
    }, 500);

  block.textContent = ""; // Clear existing content

  // Process primary section data
  const processedContactHTML = processPrimarySection(primarySection);
  // Process secondary section data
  const processedLinksHTML = processFooterSecondarySection(
    secondarySection.children[0]
  );
  // Process legal links section data
  const processedLegalLinksHTML = processFooterLegalLinksSection(
    legalsSection.children
  );
  // Process social icons section data
  const processedSocialsHTML = processFooterSocialsSection(
    socialsSection.children[0]
  );

  const footerHTML = `
    <div class="footer-content">
      <section class="footer-section footer-contact">
        <div class="footer-primary-wrapper">
          ${processedContactHTML}
        </div>
      </section>

      <section class="footer-section footer-secondary">
        <div class="footer-secondary-wrapper">
          ${processedLinksHTML}
        </div>

        <button class="footer-scroll-top desktop" aria-label="Scroll to top">
            <img src="/icons/arrow-circular.svg" alt="Scroll to top" />
          </button>
      </section>

      <section class="footer-section footer-legal">
        <div class="footer-legal-top">
          <p class="footer-copyright text-l3 text-text-black-700">${copyrightSection.children[0].textContent.trim()}</p>
         
        </div>
        <div class="footer-legal-bottom">
          <div class="footer-legal-links">
            ${processedLegalLinksHTML}
          </div>
               <div class="footer-socials">
            ${processedSocialsHTML}
          </div>
          </div>
          <button class="footer-scroll-top mobile" aria-label="Scroll to top"></button>
      </section>
    </div>
    <div id="cookiefirst-policy-page"></div>
  `;

  block.innerHTML = footerHTML;

  /* --------------------------------- Socials -------------------------------- */
  // Handle social icons position for desktop
  function handleSocialsPosition() {
    if (window.innerWidth >= 769) {
      const socialsSection = document.querySelector(".footer-socials");
      if (currentSite == "osaka" || currentSite == "maldives") {
        // Move to primary section first column
        const primarySection = document.querySelector(
          ".footer-primary-container"
        );

        const firstColumn = primarySection.children[0];
        firstColumn.appendChild(socialsSection);
      } else {
        // Move to secondary section last column
        const secondarySection = document.querySelector(
          ".footer-secondary-container"
        );

        const lastColumn =
          secondarySection.children[secondarySection.children.length - 1];

        lastColumn.appendChild(socialsSection);
      }
    } else {
      const socialsSection = document.querySelector(".footer-socials");
      const legalBottom = document.querySelector(".footer-legal-bottom");
      // Check if socialsSection is already a child of legalBottom
      if (
        legalBottom &&
        socialsSection &&
        socialsSection.parentElement === legalBottom
      ) {
        return;
      } else {
        legalBottom.appendChild(socialsSection);
      }
    }
  }
  handleSocialsPosition();

  addEventListener("resize", handleSocialsPosition);

  /* ------------------------------ Functionality ----------------------------- */
  // Add accordion functionality
  block.querySelectorAll(".accordion-trigger").forEach((button) => {
    button.addEventListener("click", () => toggleAccordion(button));
  });

  // Add scroll to top functionality
  block
    .querySelector(".footer-scroll-top.mobile")
    .addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  // Add scroll to top functionality
  block
    .querySelector(".footer-scroll-top.desktop")
    .addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  block.querySelector(".cookieLink").addEventListener("click", (event) => {
    event.stopPropagation();
    event.preventDefault();
    // if (window.lenis && typeof window.lenis.start === "function") {
    //   window.lenis.stop();
    // }
    cookiefirst_show_settings();
  });
}

/* --------------- Listen for changes in authoring environment -------------- */
handleAuthoringContentChange("main", handleAuthoringEnv);
