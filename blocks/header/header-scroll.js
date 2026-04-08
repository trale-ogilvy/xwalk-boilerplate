import { supportedLangs, supportedSites } from "../../constants.js";
/**
 * Scroll and interaction utilities for header component
 */

/**
 * Creates scroll behavior manager
 */
export function createScrollManager(
  header,
  navLogoText,
  navLogoWhite,
  navLogoGreen,
  langSelector,
  hasHero,
  isReserveHub = false,
  isGhaDashboard = false,
  isHeroAlt = false
) {
  let lastScrollY = window.scrollY;
  let ticking = false;
  let navHidden = false;
  let scrollListener = null;

  function setHeaderBackground(scrolled) {
    if (isGhaDashboard) {
      const ghaLogoImg = document.querySelector(".gha-logo-wrapper img");
      const atTop = window.scrollY === 0;
      if (!atTop) {
        header.classList.add("is-scrolled");
        header.style.backgroundColor = "white";
        if (ghaLogoImg)
          ghaLogoImg.style.filter =
            "brightness(0) saturate(100%) invert(35%) sepia(7%) saturate(788%) hue-rotate(99deg) brightness(99%) contrast(85%)";
      } else {
        header.classList.remove("is-scrolled");
        header.style.backgroundColor = "transparent";
        if (ghaLogoImg) ghaLogoImg.style.filter = "";
      }
    } else {
      if (scrolled) {
        header.classList.add("is-scrolled");
        header.style.backgroundColor = "white";
        langSelector.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
        header.style.backgroundColor = "";
        langSelector.classList.remove("is-scrolled");
      }
    }
  }

  function updateLogoTextOpacity(scrollY, vh, hasHero) {
    let opacity = 1;
    if (isHeroAlt || isReserveHub) {
      const logo = header.querySelector(".nav-logo ");
      if (scrollY < vh || scrollY !== 0) {
        navLogoText.style.transition = "opacity 0.5s";
        opacity = 0;
      }
      if (scrollY === 0) {
        navLogoText.style.transition = "opacity 0.5s";
        opacity = 1;

        logo.style.top = "70%";
      } else {
        logo.style.top = "50%";
      }
    } else {
      if (!navLogoText) return;
      if (scrollY < vh && hasHero) {
        opacity = 1 - Math.min(scrollY / (vh * 0.2), 1);
      } else {
        opacity = 0;
      }
    }
    navLogoText.style.opacity = opacity;
  }

  function updateLogoColor(scrollY, vh, hasHero) {
    if (!navLogoWhite || !navLogoGreen) return;
    if (isReserveHub || isHeroAlt) {
      navLogoWhite.style.opacity = 0;
      navLogoGreen.style.opacity = 1;
      return;
    }
    if (!hasHero || scrollY > vh) {
      navLogoWhite.style.opacity = 0;
      navLogoGreen.style.opacity = 1;
    } else {
      navLogoWhite.style.opacity = 1;
      navLogoGreen.style.opacity = 0;
    }
  }

  function updateHeaderSlide(scrollY, vh, hasHero) {
    if (
      (scrollY === 0 && isHeroAlt) ||
      (scrollY === 0 && isReserveHub) ||
      (scrollY === 0 && !hasHero)
    ) {
      header.style.transition = "transform 0.5s ease";
      header.style.transform = "translateY(0)";
      navHidden = false;
      setHeaderBackground(false);
      return;
    }

    if ((hasHero && scrollY > vh) || !hasHero || isReserveHub) {
      setHeaderBackground(true);
      const delta = scrollY - lastScrollY;
      if (delta > 0 && !navHidden && scrollY !== 0) {
        header.style.transition = "transform 0.5s ease";
        header.style.transform = "translateY(-100%)";
        navHidden = true;
      } else if (delta < 0 && navHidden) {
        header.style.transition = "transform 0.5s ease";
        header.style.transform = "translateY(0)";
        navHidden = false;
      }
    } else {
      setHeaderBackground(false);
      header.style.transition = "transform 0.5s ease";
      header.style.transform = "translateY(0)";
      navHidden = false;
    }
  }

  function handleScroll() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    updateLogoTextOpacity(scrollY, vh, hasHero);
    updateLogoColor(scrollY, vh, hasHero);
    updateHeaderSlide(scrollY, vh, hasHero);
    lastScrollY = scrollY;
    ticking = false;
  }

  function addScrollListener() {
    if (!scrollListener) {
      scrollListener = () => {
        if (!ticking) {
          window.requestAnimationFrame(handleScroll);
          ticking = true;
        }
      };
      window.addEventListener("scroll", scrollListener, { passive: true });
    }
  }

  function removeScrollListener() {
    if (scrollListener) {
      window.removeEventListener("scroll", scrollListener, { passive: true });
      scrollListener = null;
    }
  }

  // Initialize scroll behavior
  updateLogoColor(window.scrollY, window.innerHeight, hasHero);
  updateHeaderSlide(
    window.scrollY,
    window.innerHeight,
    hasHero || isHeroAlt || isReserveHub
  );
  addScrollListener();

  if (isHeroAlt) {
    setTimeout(() => {
      // Hide contact us
      const quickLinks = document.querySelector(".nav-quick-links");
      if (quickLinks) {
        quickLinks.style.opacity = "0";
      }
    }, 0);
  }

  return {
    addScrollListener,
    removeScrollListener,
  };
}

/**
 * Language selector toggle functionality
 */
export function toggleLanguageSelector(langSelector) {
  const isOpen = langSelector.getAttribute("aria-expanded") === "true";
  langSelector.setAttribute("aria-expanded", isOpen ? "false" : "true");
  // Add: set lang on html when a language is selected
  const options = langSelector.parentElement.querySelectorAll(
    ".language-options button"
  );

  options.forEach((btn) => {
    btn.onclick = function () {
      const lang = btn.dataset.lang || btn.textContent.trim().toLowerCase();
      const currentUrl = new URL(window.location.href);

      let pathParts = currentUrl.pathname.split("/").filter(Boolean);

      if (pathParts.length > 0 && supportedSites.includes(pathParts[0])) {
        // If path starts with a supported site
        if (pathParts.length > 1 && supportedLangs.includes(pathParts[1])) {
          // Already has lang after site
          if (lang === "en") {
            pathParts.splice(1, 1); // Remove lang for English
          } else {
            pathParts[1] = lang; // Replace with selected lang
          }
        } else {
          // No lang after site
          if (lang !== "en") {
            pathParts.splice(1, 0, lang); // Insert lang after site
          }
        }
      } else {
        // Path does not start with supported site
        if (supportedLangs.includes(pathParts[0])) {
          if (lang === "en") {
            pathParts.splice(0, 1);
          } else {
            pathParts[0] = lang;
          }
        } else {
          if (lang !== "en") {
            pathParts.unshift(lang);
          }
        }
      }

      const newPath = "/" + pathParts.join("/");
      window.location.pathname = newPath;
    };
  });
}
