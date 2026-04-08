import { supportedLangs, supportedSites } from "../../constants.js";

/**
 * Content population utilities for header component
 */

/**
 * Creates quick links navigation
 */
export function createQuickLinks(quickLinksUl, navQuickLinks) {
  if (!quickLinksUl || !navQuickLinks) return;

  const quickLinksArray = [];
  quickLinksUl.querySelectorAll("li a").forEach((link) => {
    const quickLink = document.createElement("a");
    quickLink.href = link.href;
    quickLink.textContent = link.textContent.trim();
    quickLink.className = "quick-link animate-underline";
    quickLinksArray.push(quickLink);
  });

  // Add quick links with separators
  quickLinksArray.forEach((link, index) => {
    navQuickLinks.appendChild(link);
    if (index < quickLinksArray.length - 1) {
      const separator = document.createElement("span");
      separator.textContent = " | ";
      separator.className = "quick-link-separator";
      navQuickLinks.appendChild(separator);
    }
  });
}

/**
 * Creates reserve button for desktop and mobile
 */
export function createReserveButtons(reserveBtn, navReserve) {
  if (!reserveBtn) return null;

  // Clone for desktop
  const reserveBtnDesktop = reserveBtn.cloneNode(true);
  reserveBtnDesktop.className = "cta-button";
  navReserve.append(reserveBtnDesktop);

  // Clone for mobile
  const reserveBtnMobile = reserveBtn.cloneNode(true);
  reserveBtnMobile.className = "cta-button";

  return reserveBtnMobile;
}

/**
 * Creates language selector dropdown
 */
export function createLanguageSelector(languageUl, languageOptions, nav) {
  if (!languageUl) return;
  const pathParts = window.location.pathname.split("/").filter(Boolean);

  // Case 1: URL starts directly with language (/en/about)
  let urlLang = pathParts[0];

  // Case 2: URL starts with site (/maldives/ja/...)
  if (
    supportedSites.includes(pathParts[0]) &&
    supportedLangs.includes(pathParts[1])
  ) {
    urlLang = pathParts[1];
  }

  // Also check query param override (?lang=ja)
  const paramLang = new URLSearchParams(window.location.search).get("lang");
  if (paramLang && supportedLangs.includes(paramLang)) {
    urlLang = paramLang;
  }

  // Fallback to English if nothing valid found
  if (!supportedLangs.includes(urlLang)) {
    urlLang = "en";
  }

  languageUl.querySelectorAll("li").forEach((li) => {
    const [display, code] = li.textContent.split("|").map((s) => s.trim());
    const langCode = code || display.toLowerCase();

    const button = document.createElement("button");
    button.className = "text-b animate-underline";
    button.innerHTML = display;
    button.dataset.lang = langCode;

    if (langCode === urlLang) {
      nav.querySelector(".language-selector span").innerHTML = display;
      button.classList.add("selected");
    }

    languageOptions.append(button);
  });
}

/**
 * Creates external links section
 */
export function createExternalLinks(externalButton, externalLink) {
  if (!externalButton || !externalLink) return;

  // Clone the button and modify it for external link styling
  const a = externalButton.cloneNode(true);
  a.classList.add("text-b");
  a.classList.remove("button"); // Remove button styling

  const span = document.createElement("span");
  span.textContent = a.textContent.trim();
  a.innerHTML = "";
  span.classList.add("animate-underline");
  a.append(span);
  a.innerHTML += '<div class="exit-icon"></div>';
  externalLink.append(a);
}

/**
 * Creates navigation cards section
 */
export function createNavCards(cardsBlock, navCards) {
  if (!cardsBlock || !navCards) return;

  const cardsItems = cardsBlock.querySelectorAll("li");
  cardsItems.forEach((item) => {
    const imageDiv = item.querySelector(".cards-card-image");
    const bodyDivs = item.querySelectorAll(".cards-card-body");
    const linkElement = item.querySelector(".cards-card-body a");

    // Get the first body div (text content) and check for link
    const textBodyDiv = bodyDivs[0];

    if (imageDiv && textBodyDiv) {
      let cardContainer;

      // If there's a link, wrap the entire card in an anchor
      if (linkElement) {
        cardContainer = document.createElement("a");
        cardContainer.href = linkElement.href;
        cardContainer.className = "nav-card nav-card-link";
        cardContainer.setAttribute("target", "_blank");
        cardContainer.setAttribute("rel", "noopener noreferrer");
      } else {
        cardContainer = document.createElement("div");
        cardContainer.className = "nav-card";
      }

      // Clone and append image
      const clonedImage = imageDiv.cloneNode(true);
      clonedImage.className = "nav-card-image";
      cardContainer.appendChild(clonedImage);

      // Clone and append text content (only the first body div with text)
      const clonedBody = textBodyDiv.cloneNode(true);
      clonedBody.className = "nav-card-body text-p2";
      cardContainer.appendChild(clonedBody);

      navCards.appendChild(cardContainer);
    }
  });
}

/**
 * Creates nav imprints section
 */
export function createNavImprints(navImprintsBlock, navImprintsTarget) {
  if (!navImprintsBlock || !navImprintsTarget) return;

  // Clone the entire nav-imprints-cards block to preserve original styling
  const clonedImprints = navImprintsBlock.cloneNode(true);
  navImprintsTarget.appendChild(clonedImprints);
}

export function animateImprintsCards(cardsSection) {
  if (!cardsSection) return;

  /* ----------------------------- Header Animate ----------------------------- */
  const header = cardsSection.querySelector(".nav-imprints-header");
  gsap.set(header, {
    opacity: 0,
  });
  gsap.to(header, {
    opacity: 1,
    delay: 1.4,
    duration: 0.6,
  });

  /* ------------------------------ Image Card Animate ----------------------------- */

  const cards = cardsSection.querySelector(".nav-imprints-cards-images");
  const children = Array.from(cards.children);
  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  children.forEach((card, index) => {
    gsap.set(card, {
      opacity: 0,
      y: 40,
      rotate: 0,
      marginLeft: 0,
      marginTop: 0,
    });
    gsap.to(card, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: 0.6,
      ease: "power2.out",
      onComplete: () => {
        // Trigger hover animation for the last card
        if (index === children.length - 1) {
          if (children[0]) {
            gsap.to(children[0], {
              rotate: -24,
              xPercent: -50,
              yPercent: -50,
              y: "var(--hover-translate-y, 0px)",
              marginTop: isMobile ? "2rem" : "2.5rem",
              marginLeft: isMobile ? "-1.5rem" : "-2rem",
              zIndex: 3,
              duration: 0.5,
              ease: "power2.out",
            });
          }
          if (children[1]) {
            gsap.to(children[1], {
              rotate: 0,
              xPercent: -50,
              yPercent: -50,
              y: "var(--hover-translate-y, 0px)",
              marginTop: "1rem",
              zIndex: 4,
              duration: 0.5,
              ease: "power2.out",
            });
          }
          if (children[2]) {
            gsap.to(children[2], {
              rotate: 24,
              xPercent: -50,
              yPercent: -50,
              y: "var(--hover-translate-y, 0px)",
              marginTop: "1rem",
              marginLeft: isMobile ? "2.5rem" : "3.5rem",
              zIndex: 5,
              duration: 0.5,
              ease: "power2.out",
            });
          }
        }
      },
    });
  });
}
