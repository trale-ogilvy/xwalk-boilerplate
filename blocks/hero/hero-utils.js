import { isUniversalEditor } from "../../scripts/aem.js";
import { createCalendar } from "../programs-listings/calendar-component.js";
import { createArtistCard, getLanguage } from "../../scripts/utils.js";

function setupPlaceholderTicker(input, text) {
  const sentences = [
    text, // Original text (first one always)
    "Describe your ideal adventure...",
    "What makes a perfect stay?",
    "What flavours excite your palate?",
    "What's your ideal wellness retreat?",
  ];

  let currentSentenceIndex = 0;
  let currentCharIndex = sentences[currentSentenceIndex].length;
  let isDeleting = true;
  let typingSpeed = 100;
  let pauseTime = 2000;
  let tickerTimeout;
  let isTickerActive = true;
  let originalValue = "";

  input.placeholder = sentences[currentSentenceIndex];

  function type() {
    if (!isTickerActive) return;

    const currentSentence = sentences[currentSentenceIndex];

    if (isDeleting) {
      input.placeholder = currentSentence.substring(0, currentCharIndex - 1);
      currentCharIndex--;
      typingSpeed = 50;
    } else {
      input.placeholder = currentSentence.substring(0, currentCharIndex + 1);
      currentCharIndex++;
      typingSpeed = 100;
    }

    if (!isDeleting && currentCharIndex === currentSentence.length) {
      isDeleting = true;
      typingSpeed = pauseTime;
    } else if (isDeleting && currentCharIndex === 0) {
      isDeleting = false;
      // Move to next sentence in the loop
      currentSentenceIndex = (currentSentenceIndex + 1) % sentences.length;
      typingSpeed = 100;
    }

    tickerTimeout = setTimeout(type, typingSpeed);
  }

  input.addEventListener("focus", () => {
    isTickerActive = false;
    clearTimeout(tickerTimeout);
    originalValue = input.value;
    input.placeholder = "";
  });

  input.addEventListener("blur", () => {
    if (input.value.trim() === "") {
      isTickerActive = true;
      // Reset to current sentence and resume
      input.placeholder = sentences[currentSentenceIndex].substring(
        0,
        currentCharIndex
      );
      tickerTimeout = setTimeout(type, typingSpeed);
    }
  });

  type();
}

// Currency and locale mapping
function getCurrencyAndLocale(lang) {
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
function getHotelConfig(location) {
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
 * Animates hero text elements with GSAP
 * @param {HTMLElement} container - The container element
 */
export function animateHeroText(container) {
  if (isUniversalEditor()) {
    return;
  }
  const textFadeIn = container.querySelectorAll(".hero-fade-in");
  const textElements = container.querySelectorAll(".hero-slide-text");

  if (textFadeIn.length > 0) {
    textFadeIn.forEach((el) => {
      if (window.gsap) {
        window.gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" }
        );
      } else {
        el.style.opacity = 1;
      }
    });
  }

  if (window.gsap && textElements.length === 2) {
    const [firstChild, secondChild] = textElements;
    // Set initial state
    window.gsap.set([firstChild, secondChild], { opacity: 0 });

    // Check if splash screen exists and delay animation if it does
    const splashScreen = document.querySelector(
      ".flower-splash-screen-container"
    );
    const animationDelay =
      splashScreen && localStorage.getItem("flowerSplashPlayed") !== "true"
        ? 3.5
        : 0;

    if (firstChild) {
      window.gsap.fromTo(
        firstChild,
        { x: "-5%", opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1.5,
          ease: "power2.out",
          delay: animationDelay,
        }
      );
    }
    if (secondChild) {
      window.gsap.fromTo(
        secondChild,
        { x: "5%", opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1.5,
          ease: "power2.out",
          delay: animationDelay + 0.2,
        }
      );
    }
  } else {
    textElements.forEach((el) => {
      if (window.gsap) {
        window.gsap.fromTo(
          el,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power2.out" }
        );
      } else {
        el.style.opacity = 1;
      }
    });
  }
}

/**
 * Animates hero CTA and label elements with GSAP
 * @param {HTMLElement} container - The container element
 */
export function animateHeroElements(container) {
  const ctaElement = container.querySelector(".hero-cta-wrapper");
  const labelElement = container.querySelector(".label-text");
  if (isUniversalEditor()) {
    return;
  }
  if (window.gsap) {
    // Check if splash screen exists and delay animation if it does
    const splashScreen = document.querySelector(
      ".flower-splash-screen-container"
    );
    const animationDelay =
      splashScreen && localStorage.getItem("flowerSplashPlayed") !== "true"
        ? 4.5
        : 0;

    // Set initial state for elements that exist
    const elementsToAnimate = [ctaElement, labelElement].filter(Boolean);
    if (elementsToAnimate.length > 0) {
      window.gsap.set(elementsToAnimate, { opacity: 0 });
    }

    // Animate CTA wrapper
    if (ctaElement) {
      window.gsap.fromTo(
        ctaElement,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          delay: animationDelay,
        }
      );
    }

    // Animate label text
    if (labelElement) {
      window.gsap.fromTo(
        labelElement,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          delay: animationDelay,
        }
      );
    }
  }
}

/**
 * Sets up video modal functionality
 * @param {HTMLElement} container - The container element
 */
export function setupVideoModal(container) {
  const modal = container.querySelector(".video-modal");
  const openButton = container.querySelector(".hero-cta-wrapper");
  const closeButtons = container.querySelectorAll(".modal-close-btn");

  if (modal && openButton) {
    openButton.addEventListener("click", (e) => {
      e.preventDefault();
      modal.showModal();

      // Disable scrolling with multiple approaches for reliability
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      // Trigger fade in animation
      modal.classList.remove("fade-out");
      modal.classList.add("fade-in");

      // Start playing video when modal opens
      const video = modal.querySelector("video");
      if (video) {
        video.currentTime = 0; // Reset to beginning
        video.loop = false;
        video.play().catch(console.error); // Play video (handle potential autoplay restrictions)
        video.addEventListener("ended", () => {
          closeModal();
        });
      }
    });

    // Function to handle modal closing with fade out
    const closeModal = () => {
      // Start fade out animation
      modal.classList.remove("fade-in");
      modal.classList.add("fade-out");

      // Wait for animation to complete before actually closing
      setTimeout(() => {
        modal.close();

        // Re-enable scrolling
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";

        // Pause and reset video when closing
        const video = modal.querySelector("video");
        if (video) {
          video.pause();
          video.currentTime = 0; // Reset to beginning for next time
        }
      }, 300); // Match the CSS transition duration
    };

    closeButtons.forEach((button) => {
      button.addEventListener("click", closeModal);
    });

    // Close on backdrop click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Handle ESC key to close modal - prevent default dialog behavior
    const handleEscKey = (e) => {
      if (e.key === "Escape" && modal.open) {
        e.preventDefault(); // Prevent default dialog close behavior
        closeModal();
      }
    };

    document.addEventListener("keydown", handleEscKey);

    // Also listen for the dialog's cancel event (triggered by ESC)
    modal.addEventListener("cancel", (e) => {
      e.preventDefault(); // Prevent default immediate close
      closeModal();
    });
  }
}

/**
 * Sets up reservation bar functionality with calendar and guests popup
 * @param {HTMLElement} parallaxWrapper - The container element
 */
export function setupReservationBar(parallaxWrapper, placeholders) {
  // Support both desktop and mobile bars
  const reserveBars = parallaxWrapper.querySelectorAll(
    ".hero-reserve-bar, .hero-reserve-bar-mobile"
  );
  reserveBars.forEach((reserveBar) => {
    const reserveDatesBtn = reserveBar.querySelector(".reserve-dates-btn");
    const reserveGuestsBtn = reserveBar.querySelector(".reserve-guests-btn");
    const reserveForm = reserveBar.querySelector(".reserve-form");

    let calendarPopup = null;
    let guestsPopup = null;
    let adults = 2;
    let children = 0;
    let selectedRange = null;
    const originalDateText =
      placeholders?.bookbarArrivaldepart || "Arrive / Depart";

    let calendarClickOutsideHandler = null;
    let calendarScrollHandler = null;
    let guestsClickOutsideHandler = null;

    if (!reserveDatesBtn || !reserveGuestsBtn || !reserveForm) return;

    // --- Calendar Dropdown Functions ---
    const closeCalendar = (chevron) => {
      if (calendarPopup && calendarPopup.parentNode) {
        calendarPopup.classList.remove("visible"); // Start fade-out
        setTimeout(() => {
          if (calendarPopup && calendarPopup.parentNode) {
            calendarPopup.parentNode.removeChild(calendarPopup);
          }
          calendarPopup = null;
          chevron.classList.remove("rotated");
          if (calendarClickOutsideHandler) {
            document.removeEventListener(
              "mousedown",
              calendarClickOutsideHandler
            );
            calendarClickOutsideHandler = null;
          }
          if (calendarScrollHandler) {
            window.removeEventListener("scroll", calendarScrollHandler, true);
            calendarScrollHandler = null;
          }
        }, 300);
      }
    };

    const openCalendar = (chevron) => {
      closeGuestsPopup(reserveGuestsBtn.querySelector(".chevron-guests"));

      chevron.classList.add("rotated");

      calendarPopup = createCalendar({
        onSelect: (selection) => {
          selectedRange = selection.value;
          reserveDatesBtn.querySelector(".reserve-dates-text").textContent =
            selection.display;
        },
        onDone: () => {
          if (!selectedRange || selectedRange === null) {
            reserveDatesBtn.querySelector(".reserve-dates-text").textContent =
              originalDateText;
          }
          closeCalendar(chevron);
        },
        hideDoneButton: false,
        placeholders: placeholders,
      });

      reserveDatesBtn.parentNode.appendChild(calendarPopup);
      calendarPopup.setAttribute("aria-open", "true");

      setTimeout(() => {
        calendarPopup.classList.add("visible");
      }, 10);

      calendarClickOutsideHandler = (event) => {
        if (
          !calendarPopup.contains(event.target) &&
          !reserveDatesBtn.contains(event.target)
        ) {
          closeCalendar(chevron);
        }
      };

      calendarScrollHandler = () => {
        closeCalendar(chevron);
      };

      setTimeout(() => {
        document.addEventListener("mousedown", calendarClickOutsideHandler);
        window.addEventListener("scroll", calendarScrollHandler, true);
      }, 0);

      setTimeout(() => {
        const doneBtn = calendarPopup.querySelector(
          ".events-filter-done-btn.cta-button-mobile"
        );
        if (doneBtn) {
          doneBtn.addEventListener("click", (ev) => {
            ev.preventDefault();
            closeCalendar(chevron);
          });
        }
      }, 0);
    };

    reserveDatesBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const chevron = reserveDatesBtn.querySelector(".chevron-dates");
      if (calendarPopup) {
        closeCalendar(chevron);
      } else {
        openCalendar(chevron);
      }
    });

    const closeGuestsPopup = (chevron) => {
      if (guestsPopup && guestsPopup.parentNode) {
        guestsPopup.classList.remove("visible"); // Start fade-out
        setTimeout(() => {
          if (guestsPopup && guestsPopup.parentNode) {
            guestsPopup.parentNode.removeChild(guestsPopup);
          }
          guestsPopup = null;
          chevron.classList.remove("rotated");
          if (guestsClickOutsideHandler) {
            document.removeEventListener(
              "mousedown",
              guestsClickOutsideHandler
            );
            guestsClickOutsideHandler = null;
          }
        }, 300);
      }
    };

    const openGuestsPopup = (chevron) => {
      closeCalendar(reserveDatesBtn.querySelector(".chevron-dates"));

      chevron.classList.add("rotated");
      guestsPopup = document.createElement("div");
      guestsPopup.className = "guests-dropdown";
      guestsPopup.innerHTML = `
        <div class="guests-row">
          <div class="guests-label">${placeholders?.bookbarAdults || "Adults"
        }</div>
          <div class="guests-controls">
            <button type="button" class="guests-minus" data-type="adults" aria-label="Decrease adults">
              <img src="/icons/minus.svg" alt="Minus" width="24" height="24" />
            </button>
            <span class="guests-count" data-type="adults">${adults}</span>
            <button type="button" class="guests-plus" data-type="adults" aria-label="Increase adults">
              <img src="/icons/add.svg" alt="Add" width="24" height="24" />
            </button>
          </div>
        </div>
        <div class="guests-row">
          <div class="guests-label">${placeholders?.bookbarChildren || "Children"
        }</div>
          <div class="guests-controls">
            <button type="button" class="guests-minus" data-type="children" aria-label="Decrease children">
              <img src="/icons/minus.svg" alt="Minus" width="24" height="24" />
            </button>
            <span class="guests-count" data-type="children">${children}</span>
            <button type="button" class="guests-plus" data-type="children" aria-label="Increase children">
              <img src="/icons/add.svg" alt="Add" width="24" height="24" />
            </button>
          </div>
        </div>
        <div class="done-guest cta-button">
              ${placeholders?.doneButton || "Done"}
        </div>
      `;
      reserveGuestsBtn.parentNode.appendChild(guestsPopup);

      setTimeout(() => {
        guestsPopup.classList.add("visible");
      }, 10);

      guestsPopup.addEventListener("click", (ev) => {
        const btn = ev.target.closest("button");
        if (!btn) return;
        const type = btn.dataset.type;
        if (btn.classList.contains("guests-plus")) {
          if (type === "adults") adults++;
          if (type === "children") children++;
        }
        if (btn.classList.contains("guests-minus")) {
          if (type === "adults" && adults > 0) adults--;
          if (type === "children" && children > 0) children--;
        }
        guestsPopup.querySelector(
          '.guests-count[data-type="adults"]'
        ).textContent = adults;
        guestsPopup.querySelector(
          '.guests-count[data-type="children"]'
        ).textContent = children;
        const totalGuests = adults + children;

        const guestWord = placeholders?.bookbarGuest || "Guests";
        const guestText = `${totalGuests} ${guestWord}`;
        reserveGuestsBtn.querySelector(".reserve-guests-text").textContent =
          guestText;
      });

      guestsClickOutsideHandler = (event) => {
        if (
          !guestsPopup.contains(event.target) &&
          !reserveGuestsBtn.contains(event.target)
        ) {
          closeGuestsPopup(chevron);
        } else if (event.target.classList.contains("done-guest")) {
          closeGuestsPopup(chevron);
        }
      };

      setTimeout(
        () => document.addEventListener("mousedown", guestsClickOutsideHandler),
        0
      );
    };

    reserveGuestsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const chevron = reserveGuestsBtn.querySelector(".chevron-guests");
      if (guestsPopup) {
        closeGuestsPopup(chevron);
      } else {
        openGuestsPopup(chevron);
      }
    });

    // Handle form submit
    reserveForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Get selected dates
      let arrive = "";
      let depart = "";

      if (typeof selectedRange === "string" && selectedRange.includes(" - ")) {
        [arrive, depart] = selectedRange.split(" - ");
      } else if (typeof selectedRange === "string") {
        arrive = selectedRange;
        depart = selectedRange;
      }

      // Fallback: if no date selected, do nothing or handle as needed
      if (!arrive || !depart) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        arrive = today.toISOString().split("T")[0];
        depart = tomorrow.toISOString().split("T")[0];
      }

      // Get guests
      let adultCount = 2;
      let childCount = 0;

      if (guestsPopup) {
        const adultsElement = guestsPopup.querySelector(
          '.guests-count[data-type="adults"]'
        );
        const childrenElement = guestsPopup.querySelector(
          '.guests-count[data-type="children"]'
        );

        if (adultsElement) {
          adultCount = parseInt(adultsElement.textContent) || 2;
        }
        if (childrenElement) {
          childCount = parseInt(childrenElement.textContent) || 0;
        }
      } else {
        adultCount = adults;
        childCount = children;
      }

      const currentLanguage = getLanguage();
      const { currency, locale } = getCurrencyAndLocale(currentLanguage);

      const currentUrl = window.location.href.toLowerCase();
      let location = "maldives";
      if (currentUrl.includes("osaka")) {
        location = "osaka";
      } else if (currentUrl.includes("maldives")) {
        location = "maldives";
      }

      const { hotel, chain } = getHotelConfig(location);

      const url = `https://be.synxis.com/?adult=${adultCount}&arrive=${arrive}&chain=${chain}&child=${childCount}&currency=${currency}&depart=${depart}&hotel=${hotel}&level=hotel&locale=${locale}&productcurrency=${currency}`;

      // Use the common GA4 tracking utility
      window.open(url, "_blank");
    });
  });
}

/**
 * Creates the hero HTML structure
 * @param {Object} options - Configuration options
 * @returns {string} HTML string
 */
export function createHeroHTML({
  labelText,
  processedTextContent,
  isVideoCtaValue,
  ctaButtonText,
  ctaLinkUrl,
  secondaryCtaText,
  reserveBarValue,
  aiChatInputValue,
  aiChatInputPlaceholderText,
  isArtistValue,
  artistImageValue,
  artistNameValue,
  artistId,
  placeholders,
}) {
  return `
    <section class="hero-wrapper">
      <section class="hero-container">
        <div class="hero-media-container">
          <!-- Video will be inserted here by handleMediaBlocks -->
        </div>
        <div class="hero-overlay"></div>
        <div class="hero-content  text-text-white">
            ${labelText
      ? `<div>
                    <p class="text-l2 label-text">${labelText}</p>
                  </div>`
      : ""
    }
            <div class="hero-text-container">
          ${processedTextContent}
            </div>
            <div class="hero-cta-wrapper
            ">
                ${isVideoCtaValue
      ? `
                    <p class="play-icon"><span class="cta-link animate-underline">${ctaButtonText}</span></p>
                    `
      : ctaLinkUrl && ctaButtonText
        ? `
                   <a href="${ctaLinkUrl}" class="${secondaryCtaText ? "" : "chevron-right"
        } cta-link text-text-white"><span class="animate-underline">${ctaButtonText}</span></a> 
                    `
        : ""
    }
                ${secondaryCtaText
      ? `
                    <div class="divider"></div>
                    <a href="${secondaryCtaText.getAttribute(
        "href"
      )}" class="${secondaryCtaText.textContent.trim().toUpperCase() === 'DISCOVER PATINA OSAKA' ? "" : "chevron-right"} cta-link text-text-white secondary-cta"><span class="animate-underline">${secondaryCtaText.textContent.trim()}</span></a> `
      : ""
    }
            </div>
      
      </section>
      ${isVideoCtaValue
      ? `
      <dialog class="video-modal">
        <div class="video-container-wrapper">
            <!-- Video will be inserted here by handleMediaBlocks -->
            <button class="modal-close-btn text-b" aria-label="Close video modal">
              <span class="close-icon"></span><span class="animate-underline">CLOSE</span>
            </button>
        </div>
      </dialog>`
      : ""
    }
                ${
    /* -------------------------------- AI Input -------------------------------- */
    aiChatInputValue
      ? `<div class="hero-ai-chat-input">
                <div class="ai-chat-icon"><img src="/icons/ai-dots-icon.svg" alt="AI Chat Icon" /></div>
                    <input id="ai-chat" type="text" class="ai-chat-input text-l2" placeholder="${aiChatInputPlaceholderText || ""
      }" />
                    <button class="ai-chat-submit-button">
                      <img src="/icons/arrow.svg" alt="arrow right" />
                    </button>
                  </div>`
      : ""
    }
        ${
    /* ------------------------------- Artist Card ------------------------------ */
    isArtistValue
      ? createArtistCard(
        artistImageValue.innerHTML,
        artistNameValue,
        artistId
      )
      : ""
    }
      ${
    /* ------------------------------- Reserve bar ------------------------------ */
    reserveBarValue
      ? `<div class="hero-reserve-bar">
                    <form class="reserve-form">
                      <div class="reserve-fields">
                        <button type="button" class="reserve-dates-btn">
                          <span class="reserve-dates-text">${placeholders?.bookbarArrivaldepart ||
      "Arrive / Depart"
      }</span>
                          <img class="reserve-chevron chevron-dates" src="/icons/chevron_down.svg" alt="Open calendar" />
                        </button>
                        <div class="reserve-separator"></div>
                        <button type="button" class="reserve-guests-btn">
                          <span class="reserve-guests-text">2 ${placeholders?.bookbarGuest || "Guests"
      }</span>
                          <img class="reserve-chevron chevron-guests" src="/icons/chevron_down.svg" alt="Open guests" />
                        </button>
                      </div>
                      <button type="submit" class="reserve-submit">
                        <span>${placeholders?.bookbarAvailability ||
      "Check Availability"
      }</span>
                      </button>
                    </form>
                  </div>`
      : ""
    }
    </section>
  `;
}

/**
 * Setup AI chat input click handler
 */
export function setupAIChatInput(aiChatInputPlaceholderText = null) {
  const aiChatButton = document.querySelector(".ai-chat-submit-button");
  const chatInput = document.querySelector(".ai-chat-input");

  if (aiChatButton && chatInput) {
    let rawText =
      aiChatInputPlaceholderText && aiChatInputPlaceholderText.trim() !== ""
        ? aiChatInputPlaceholderText
        : chatInput.getAttribute("placeholder") || "";

    if (rawText !== "") {
      setupPlaceholderTicker(chatInput, rawText);
    }

    aiChatButton.addEventListener("click", () => {
      const aiChatInput = chatInput.value.trim();
      const currentUrl = window.location.href.toLowerCase();
      let destination = "";
      if (currentUrl.includes("osaka")) {
        destination = "/osaka";
      } else if (currentUrl.includes("maldives")) {
        destination = "/maldives";
      }
      if (aiChatInput !== "") {
        window.open(
          `https://ai-culturist.onrender.com${destination}/?prompt=${aiChatInput}`,
          "_blank"
        );
        chatInput.value = "";
      }
    });

    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        aiChatButton.click();
      }
    });
  }
}

/**
 * Hide navigation reserve button
 */
export function hideNavReserveButton(isBrand = false) {
  let elementsToHide = ".nav-reserve, .reserve-bar-mobile";
  if (isBrand) {
    elementsToHide = ".nav-reserve, .reserve-bar-mobile";
  }
  setTimeout(() => {
    const reserveElements = document.querySelectorAll(elementsToHide);
    reserveElements.forEach((element) => element.classList.add("hide"));
  }, 1000);
}
