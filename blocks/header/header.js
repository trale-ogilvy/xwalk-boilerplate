import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import { loadFragment } from "../fragment/fragment.js";
import { disableScroll } from "../../scripts/utils.js";
import { createDropdownNavigation } from "./header-navigation.js";
import {
  createQuickLinks,
  createReserveButtons,
  createLanguageSelector,
  createExternalLinks,
  createNavCards,
  createNavImprints,
  animateImprintsCards,
} from "./header-content.js";
import {
  createScrollManager,
  toggleLanguageSelector,
} from "./header-scroll.js";
import { renderNewsletterModal } from "../newsletter-modal/newsletter-modal.js";
import { animateChildrenTextSplitStagger } from "../../scripts/animations.js";
import { supportedLangs, supportedSites } from "../../constants.js";
import { fetchPlaceholders } from "../../scripts/utils.js";

async function getMenuText() {
  try {
    const placeholders = await fetchPlaceholders();
    return placeholders.globalMenu || "Menu";
  } catch (error) {
    console.error("Error fetching placeholders:", error);
    return "Menu";
  }
}

async function getCloseText() {
  try {
    const placeholders = await fetchPlaceholders();
    return placeholders.globalClose || "Close";
  } catch (error) {
    console.error("Error fetching placeholders:", error);
    return "Close";
  }
}

async function toggleMenu(header, forceClose = false) {
  const hamburger = header.querySelector(".hamburger-react");
  const navMenu = header.querySelector(".nav-menu");
  const navLogoWhite = header.querySelector(".nav-logo .white");
  const navLogoGreen = header.querySelector(".nav-logo .green");
  const langSelector = header.querySelector(".language-selector");
  const menuTextButton = header.querySelector(".menu-text-button span");
  const quickLinks = header.querySelector(".nav-quick-links");
  const bookBtn = header.querySelector(".nav-reserve");
  const body = document.body;
  const isOpen = hamburger.getAttribute("aria-expanded") === "true";
  const isHeroAlt = document.querySelector(".hero-banner-alt");

  if (forceClose || isOpen) {
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open navigation menu");
    navMenu.setAttribute("aria-hidden", "true");
    body.classList.remove("nav-open");
    quickLinks.classList.remove("show");
    if (bookBtn) {
      bookBtn.classList.remove("no-hide");
    }

    // Restore scroll using the stored restore function
    if (toggleMenu.restoreScroll) {
      toggleMenu.restoreScroll();
      toggleMenu.restoreScroll = null;
    }

    // Restore logo state based on scroll/hero
    if (navLogoWhite && navLogoGreen) {
      const hasHero = !!document.querySelector(".hero-container");
      if (!hasHero || window.scrollY > window.innerHeight) {
        navLogoWhite.style.opacity = 0;
        navLogoGreen.style.opacity = 1;
      } else {
        navLogoWhite.style.opacity = 1;
        navLogoGreen.style.opacity = 0;
      }
    }
    // Remove nav-open color from language selector
    if (langSelector) {
      langSelector.classList.remove("nav-open");
    }
    // Set menu text to 'Menu'
    if (menuTextButton) {
      getMenuText().then((menuText) => {
        menuTextButton.textContent = menuText;
      });
    }
  } else {
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.setAttribute("aria-label", "Close navigation menu");
    navMenu.setAttribute("aria-hidden", "false");
    body.classList.add("nav-open");
    quickLinks.classList.add("show");
    if (bookBtn) {
      bookBtn.classList.add("no-hide");
    }

    // Disable scroll using utility function and store restore function
    toggleMenu.restoreScroll = disableScroll("menu");

    // Show green logo when menu is open
    if (navLogoWhite && navLogoGreen) {
      navLogoWhite.style.opacity = 0;
      navLogoGreen.style.opacity = 1;
    }
    // Make language selector black when menu is open
    if (langSelector) {
      langSelector.classList.add("nav-open");
    }
    // Set menu text to 'Close'
    if (menuTextButton) {
      getCloseText().then((closeText) => {
        menuTextButton.textContent = closeText;
      });
    }

    // Nav Links Animate
    const navLinks = navMenu.querySelector("ul");
    setTimeout(
      () => animateChildrenTextSplitStagger(navLinks, { delay: 0.6 }),
      0
    );

    // Imprints Animate
    const imprintsCards = navMenu.querySelector(".nav-imprints-cards");
    setTimeout(() => animateImprintsCards(imprintsCards), 0);
  }

  // Unhide quick links
  if (isHeroAlt) {
    // Quick fix for hidden header - if hero-alt and at top, nudge scroll
    setTimeout(() => {
      const quickLinks = document.querySelector(".nav-quick-links");
      if (quickLinks) {
        quickLinks.style.opacity = isOpen ? "0" : "1";
      }
    }, 0);
  }
}

async function setupBackButton(button, site) {
  const prevUrl = document.referrer;
  const currentUrl = window.location.href;

  const isFromDifferentDomain =
    prevUrl && !prevUrl.includes(window.location.hostname);
  const isFromDifferentSite =
    prevUrl &&
    ((site === "osaka" && !prevUrl.includes("/osaka")) ||
      (site === "maldives" && !prevUrl.includes("/maldives")) ||
      (!site && (prevUrl.includes("/osaka") || prevUrl.includes("/maldives"))));

  const hasHistory = window.history.length > 1;

  if (isFromDifferentDomain || isFromDifferentSite || !hasHistory) {
    button.onclick = () => {
      window.location.href = `/${site || ""}`;
    };
  } else {
    button.onclick = () => {
      window.history.back();
    };
  }

  button.addEventListener("auxclick", (e) => {
    if (e.button === 1) {
      e.preventDefault();
      window.open(`/${site || ""}`, "_blank");
    }
  });

  button.addEventListener("contextmenu", (e) => {});
}

export default async function decorate(block) {
  const prevUrl = document.referrer;
  const currentUrl = window.location.href.toLowerCase();
  const placeholders = await fetchPlaceholders();

  if (isUniversalEditor()) {
    if (currentUrl.includes("/nav")) {
      loadCSS(`${window.hlx.codeBasePath}/blocks/header/header-author.css`);
    }
    return;
  }

  block.innerHTML = "";

  let navPath = "/nav";
  let site = "";
  let logoTextPath = "/icons/patina-white-text.svg";
  const pathname = window.location.pathname.toLowerCase();
  const isHeroAlt = document.querySelector(".hero-banner-alt");
  const isReserveHub = pathname.includes("reserve-hub");
  const isGhaDashboard = pathname.includes("gha-discovery/profile");
  const isImprints = pathname.includes("/imprints");
  const isSanya = pathname.includes("/sanya");
  const isTianjin = pathname.includes("/tianjin");
  const isPDFnotFound = pathname.includes("/pdf-unavailable");
  const hasHero = !!document.querySelector(".hero-container");

  // Determine current site and language from pathname
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
  function getNavAndLogoPaths(site, lang) {
    const sitePath = site ? `/${site}` : "";
    const langPath = lang !== "en" ? `/${lang}` : "";
    return {
      navPath: `${sitePath}${langPath}/nav`,
      site,
      logoTextPath:
        isReserveHub || isHeroAlt
          ? `/icons${sitePath}/patina-green-text.svg`
          : `/icons${sitePath}/patina-white-text.svg`,
    };
  }
  // Use previous site for imprints
  const previousSite =
    supportedSites.find((site) => prevUrl.includes(site)) || "";
  const usePrevSite =
    pathname.includes("imprints") && currentSite !== previousSite;
  const siteToUse = usePrevSite ? previousSite : currentSite;

  ({ navPath, site, logoTextPath } = getNavAndLogoPaths(
    siteToUse,
    currentLang
  ));

  const fragment = await loadFragment(navPath);

  // Get menu text for initial button text
  const menuText = await getMenuText();

  const nav = document.createElement("nav");
  nav.innerHTML = `
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P2HNSHD"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->

    <section class="navbar">
      <div class="nav-wrapper">
      ${
        /* -------------------------------- Left Side ------------------------------- */
        isGhaDashboard
          ? `<div class="gha-logo-wrapper">
            <img src="/icons/gha-logo.png" alt="Back" class="default" fetchpriority=high />
            <img src="/icons/gha-logo-slim.png" alt="Back" class="slim" fetchpriority=high />
          </div>`
          : `
        <div class="nav-hamburger">
          <div
            class="hamburger-react"
            aria-expanded="false"
            role="button"
            tabindex="0"
            aria-label="Open navigation menu"
          >
            <div></div>
            <div></div>
            <div></div>
          </div>
          <button class="menu-text-button secondary" aria-label="Toggle navigation menu">
            <span>${menuText}</span>
          </button>
        </div>`
      }
      <button class="nav-back-home">
        <img src="/icons/chevron_backward.svg" alt="Back" />
        <span>BACK</span>
      </button>
      </div>
      ${
        isGhaDashboard
          ? ""
          : `<div class="nav-logo">
        <a href="/${site}">
          <img src="/icons/patina-white-flower.svg" class="white" alt="Patina Logo" fetchpriority=high />
          <img src="/icons/patina-green-flower.svg" class="green" alt="Patina Logo" fetchpriority=high />
        </a>
      </div>
      <div class="nav-logo-text">
        <img src="${logoTextPath}" alt="Patina" fetchpriority=high />
      </div>`
      }
      ${
        /* ------------------------------- Right Side ------------------------------- */
        isGhaDashboard
          ? `<button class="cta-button sign-out-button desktop">${
              placeholders.globalSignoutButtonText || "SIGN OUT"
            }</button>`
          : `<div class="nav-controls">
        <div class="nav-quick-links text-b"></div>
        <div class="nav-language">
          <button class="language-selector secondary" aria-expanded="false">
            <span>en</span>
            <div class="language-icon down-arrow-icon"></div>
          </button>
          <div class="language-options"></div>
        </div>
        <div class="nav-reserve"></div>
      </div>`
      }
    </section>
    <section class="nav-menu" aria-hidden="true">
    <div class="scroll-container-nav">
      <div class="nav-menu-content">
        <div class="main-links"></div>
        <section class="bottom-links">
          <div class="external-link"></div>
          <div class="nav-quick-links mobile text-b"></div>
          <div class="nav-cards"></div>
          </section>
          </div>
      <div class="nav-imprints-section"></div>
    </div>
    </section>
  `;

  // Hide nav-controls for /reserve-hub
  if (isReserveHub || !hasHero) {
    const navControls = nav.querySelector(".nav-controls");
    if (navControls) {
      const quickLinks = navControls.querySelector(".nav-quick-links");
      const navReserve = navControls.querySelector(".nav-reserve");

      if (quickLinks) quickLinks.style.display = "none";
      if (navReserve) navReserve.style.display = "none";

      const languageSelector = navControls.querySelector(".language-selector");
      const languageSelectorSpan = navControls.querySelector(
        ".language-selector span"
      );
      const languageIcon = navControls.querySelector(".language-icon");

      if (languageSelector) {
        languageSelector.style.color = "black";
      }
      if (languageSelectorSpan) {
        languageSelectorSpan.style.color = "black";
      }
      if (languageIcon) {
        languageIcon.style.color = "black";
      }
    }
  }

  if (isImprints || isSanya || isTianjin || isPDFnotFound) {
    const navControls = nav.querySelector(".nav-controls");
    const languageSelector = navControls.querySelector(".language-selector");
    if (languageSelector) {
      languageSelector.style.display = "none";
    }
  }

  // --- Populate structure ---
  const langSelector = nav.querySelector(".language-selector");
  const navLogo = nav.querySelector(".nav-logo a");
  const navReserve = nav.querySelector(".nav-reserve");
  const mainLinks = nav.querySelector(".main-links");
  const languageOptions = nav.querySelector(".language-options");
  const externalLink = nav.querySelector(".external-link");
  const navCards = nav.querySelector(".nav-cards");
  const navQuickLinks = nav.querySelector(".nav-quick-links");
  const mobileQuickLinks = nav.querySelector(".nav-quick-links.mobile");

  // Get sections from fragment
  const sections = fragment.querySelectorAll(".section");

  // First section: Quick Links, Language Selector, Reserve Button
  const firstSection = sections[0];
  const reserveBtn = firstSection.querySelector(".button-container a");
  const quickLinksUl = firstSection.querySelectorAll("ul")[0]; // First UL is quick links
  const languageUl = firstSection.querySelectorAll("ul")[1]; // Second UL is languages

  // Reserve button
  let reserveBtnMobile;
  if (reserveBtn && navReserve) {
    reserveBtnMobile = createReserveButtons(reserveBtn, navReserve);
  }

  // Reserve bar mobile
  const reserveBarMobile = document.createElement("div");
  reserveBarMobile.classList.add("reserve-bar-mobile");

  // Use the mobile copy of the reserve button
  if (reserveBtnMobile) {
    reserveBarMobile.append(reserveBtnMobile);
  }

  // Quick Links
  createQuickLinks(quickLinksUl, navQuickLinks);
  // Also populate mobile quick links
  createQuickLinks(quickLinksUl, mobileQuickLinks);
  // Show/hide mobile quick links on window resize
  function handleMobileQuickLinks() {
    if (window.innerWidth < 768) {
      mobileQuickLinks.classList.add("show");
    } else {
      mobileQuickLinks.classList.remove("show");
    }
  }
  window.addEventListener("resize", handleMobileQuickLinks);
  handleMobileQuickLinks();

  // Second section: Main navigation links
  const secondSection = sections[1];
  const mainNavUl = secondSection.querySelector("ul");
  const cardsWrapper = secondSection.querySelector(".cards-wrapper");

  // Create dropdown navigation
  createDropdownNavigation(mainNavUl, cardsWrapper, mainLinks, nav);

  if (!isGhaDashboard) {
    // Language selector
    createLanguageSelector(languageUl, languageOptions, nav);
  }

  // Third section: nav-imprints-header and External links
  const thirdSection = sections[2];
  if (thirdSection) {
    // Extract nav-imprints-header content
    const navImprintsBlock = thirdSection.querySelector(".nav-imprints-cards");
    const navImprintsTarget = nav.querySelector(".nav-imprints-section");
    createNavImprints(navImprintsBlock, navImprintsTarget);

    // Extract external links
    const externalButton = thirdSection.querySelector(
      ".default-content-wrapper .button"
    );
    createExternalLinks(externalButton, externalLink);

    // Extract cards content
    const cardsBlock = thirdSection.querySelector(".cards");
    createNavCards(cardsBlock, navCards);
  }

  /* --------------------------- Newsletter Section --------------------------- */
  const newsletterSection = sections[3];
  if (newsletterSection) {
    const modalBlock = newsletterSection.querySelector(".newsletter-modal");
    if (modalBlock) {
      renderNewsletterModal(modalBlock);
    }
  }

  // Set navbar background color for /reserve-hub
  if (pathname.includes("reserve-hub")) {
    const navbar = nav.querySelector(".navbar");
    if (navbar) {
      navbar.style.backgroundColor = "transparent";
    }
  }

  // Hide/show hamburger and back button for /reserve-hub
  const navHamburger = nav.querySelector(".nav-hamburger");
  const navBackHome = nav.querySelector(".nav-back-home");
  if (navBackHome) {
    setupBackButton(navBackHome, site);
  }
  if (pathname.includes("reserve-hub")) {
    if (navHamburger) navHamburger.style.display = "none";
    if (navBackHome) navBackHome.style.display = "none";
  } else {
    if (navHamburger) navHamburger.style.display = "";
    if (navBackHome) navBackHome.style.display = "none";
  }

  // --- Event listeners and scroll behavior ---
  const header = block.closest(".header-wrapper");
  const navLogoText = nav.querySelector(".nav-logo-text");
  const navLogoWhite = nav.querySelector(".nav-logo .white");
  const navLogoGreen = nav.querySelector(".nav-logo .green");

  // Initialize scroll management
  const scrollManager = createScrollManager(
    header,
    navLogoText,
    navLogoWhite,
    navLogoGreen,
    langSelector,
    hasHero,
    isReserveHub,
    isGhaDashboard,
    isHeroAlt
  );

  // Menu toggle
  const hamburger = nav.querySelector(".hamburger-react");
  const menuTextButton = nav.querySelector(".menu-text-button");
  async function menuHandler() {
    const menuIsOpen = hamburger.getAttribute("aria-expanded") === "true";
    await toggleMenu(header);
    if (!menuIsOpen) {
      scrollManager.removeScrollListener();
    } else {
      scrollManager.addScrollListener();
    }
  }
  if (!isGhaDashboard) {
    hamburger.addEventListener("click", menuHandler);
    menuTextButton.addEventListener("click", menuHandler);

    // Language selector toggle
    langSelector.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLanguageSelector(langSelector);
    });
  }

  // Close language selector when clicking outside
  document.addEventListener("click", () => {
    if (langSelector.getAttribute("aria-expanded") === "true") {
      langSelector.setAttribute("aria-expanded", "false");
    }
  });

  document.body.append(reserveBarMobile);
  block.append(nav);

  const navlink = document.querySelector(".nav-logo a");
  if (navlink) {
    const hrefValue = navlink.href;
    navlink.addEventListener("click", (e) => {
      const language = document.documentElement.lang.toUpperCase() || "EN";
      if (language !== "EN") {
        e.preventDefault();
        if (
          hrefValue === "/" ||
          hrefValue === "https://patinahotels.com/"
        ) {
          window.location.href = `${hrefValue}${document.documentElement.lang.toLocaleLowerCase()}`;
        } else {
          window.location.href = `${hrefValue}/${document.documentElement.lang.toLocaleLowerCase()}`;
        }
      }
    });
  }

  // GHA Sign Out Button
  const signOutDialog = document.querySelector(".sign-out-dialog.fade");
  const signOutBtn = block.querySelector(".sign-out-button");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", () => {
      signOutDialog.showModal();
      // Remove fade class to trigger fade in
      setTimeout(() => signOutDialog.classList.remove("fade"), 10);
    });
  }

  // If Hero Alt change header to black on load
  if (isHeroAlt || !hasHero) {
    const navHamburger = nav.querySelector(".nav-hamburger");
    const languageSelector = nav.querySelector(".language-selector");
    if (languageSelector) {
      const span = languageSelector.querySelector("span");
      const icon = languageSelector.querySelector(".language-icon");
      if (icon) {
        icon.style.color = "black";
      }
      if (span) {
        span.style.color = "black";
      }
    }
    if (navHamburger) navHamburger.style.color = "black";
  }
  setTimeout(() => {
    const heroReserveBar = document.querySelector(".hero-reserve-bar");
    if (heroReserveBar) {
      const navReserveEl = document.querySelector(".navbar .nav-reserve");
      if (navReserveEl) {
        navReserveEl.style.display = "none";
      }
    }
  }, 0);
}
