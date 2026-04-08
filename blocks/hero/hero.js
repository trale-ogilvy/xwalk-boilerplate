import { parallaxSection } from "../../scripts/animations.js";
import { isUniversalEditor } from "../../scripts/aem.js";
import {
  handleMediaBlocks,
  getElements,
  showArtistModal,
  setupArtistCardClickHandler,
  fetchPlaceholders,
} from "../../scripts/utils.js";
import {
  animateHeroText,
  animateHeroElements,
  setupVideoModal,
  setupReservationBar,
  createHeroHTML,
  hideNavReserveButton,
  setupAIChatInput,
} from "./hero-utils.js";
import { loadCSS } from "../../scripts/aem.js";

/**
 * Decorates the hero block.
 * @param {HTMLElement} block The hero block element.
 */
export default async function decorate(block) {
  // Fetch placeholders
  const placeholders = await fetchPlaceholders();

  if (isUniversalEditor()) {
    loadCSS(`${window.hlx.codeBasePath}/blocks/hero/hero-author.css`);

    // Media
    const media = block.querySelectorAll(":scope > div:nth-child(4)");
    handleMediaBlocks(media, [], block);
    const newMedia = block.querySelector(":scope > div:last-child");
    block.children[4].appendChild(newMedia);
    const isVideo = newMedia.querySelector("video") !== null;
    if (isVideo) {
      const childToRemove = newMedia.children[0]?.children[0];
      if (childToRemove) {
        childToRemove.remove();
      }
    }

    // AI Chat
    const aiChatInputBool = block.children[9].children[0].children[0];
    const aiChatInputDiv = block.children[9].children[0];
    if (aiChatInputBool && aiChatInputBool.textContent.trim() === "true") {
      const aiChatIconDiv = document.createElement("div");
      aiChatIconDiv.className = "ai-chat-icon";
      aiChatIconDiv.innerHTML = `<img src="/icons/ai-dots-icon.svg" alt="AI Chat Icon" />`;
      aiChatInputDiv.insertBefore(aiChatIconDiv, aiChatInputDiv.firstChild);
      const submitButton = document.createElement("div");
      submitButton.className = "ai-chat-submit-button";
      submitButton.innerHTML = `<img src="/icons/arrow.svg" alt="arrow right" />`;
      aiChatInputDiv.appendChild(submitButton);
    } else {
      block.children[9].style.display = "none";
    }

    // Artist
    const isArtistBool = block.children[10];
    const artistNameDiv = block.children[11];
    const artistImageDiv = block.children[12];
    if (isArtistBool && isArtistBool.textContent.trim() === "true") {
      const artistLabel = document.createElement("p");
      artistLabel.textContent = "Artist";
      artistNameDiv.appendChild(artistLabel);
      let artistName = "";
      if (artistImageDiv && artistNameDiv) {
        // Move artistNameDiv inside artistImageDiv
        artistName = artistNameDiv.textContent.trim();
        artistImageDiv.appendChild(artistNameDiv);
      }
    } else {
      artistImageDiv.style.display = "none";
      artistNameDiv.style.display = "none";
    }

    return;
  }
  console.log("Testing Github using Dev branch");
  const heroArtistId = `hero-artist-${Date.now()}`;

  const selectors = [
    {
      key: "label",
      sel: `:scope > div:nth-child(1) > div > p`,
    },
    {
      key: "mainHeroText",
      sel: `:scope > div:nth-child(2) > div`,
    },
    {
      key: "isSlideInText",
      sel: `:scope > div:nth-child(3) > div > p`,
    },
    {
      key: "media",
      sel: `:scope > div:nth-child(4) > div`,
    },
    {
      key: "ctaText",
      sel: `:scope > div:nth-child(5) > div > p`,
    },
    {
      key: "isVideoCta",
      sel: `:scope > div:nth-child(6) > div > p`,
    },
    {
      key: "video",
      sel: `:scope > div:nth-child(7) > div`,
    },
    {
      key: "ctaUrl",
      sel: `:scope > div:nth-child(8) > div > p`,
    },
    {
      key: "secondaryCta",
      sel: `:scope > div:nth-child(9) > div > p`,
    },
    {
      key: "reserveBar",
      sel: `:scope > div:nth-child(10) > div`,
    },
    {
      key: "aiChatInput",
      sel: `:scope > div:nth-child(11) > div`,
    },
    {
      key: "isArtist",
      sel: ":scope > div:nth-child(12) > div",
    },
    {
      key: "artistName",
      sel: ":scope > div:nth-child(13) > div > p",
    },
    {
      key: "artistImage",
      sel: ":scope > div:nth-child(14) > div",
    },
    {
      key: "previewImage",
      sel: ":scope > div:nth-child(15) > div",
    },
  ];

  const elements = getElements(block, selectors);

  const {
    label,
    mainHeroText,
    isSlideInText,
    media,
    ctaText,
    isVideoCta,
    video,
    ctaUrl,
    secondaryCta,
    reserveBar,
    aiChatInput,
    isArtist,
    artistName,
    artistImage,
    previewImage,
  } = elements;

  // Extract data first
  const labelText = label[0]?.textContent.trim();
  const mainHeroTextContent = mainHeroText[0];
  const isSlideInTextValue = isSlideInText[0]?.textContent.trim() === "true";
  const ctaButtonText = ctaText[0]?.textContent.trim();
  const isVideoCtaValue = isVideoCta[0]?.textContent.trim() === "true";
  const ctaLinkUrl = ctaUrl[0]?.textContent.trim();
  const reserveBarValue = reserveBar[0]?.textContent.trim() === "true";
  const aiChatInputValue = aiChatInput[0]
    ? aiChatInput[0].children[0]
      ? aiChatInput[0].children[0].textContent.trim() === "true"
      : ""
    : "";
  const aiChatInputPlaceholderText = aiChatInput[0]
    ? aiChatInput[0].children[1]
      ? aiChatInput[0].children[1]?.textContent
      : ""
    : "";
  const isArtistValue = isArtist[0]?.textContent.trim() === "true" || false;
  const artistNameValue = artistName[0]?.textContent.trim() || "";
  const artistImageValue = artistImage[0] ? artistImage[0].children[0] : null;
  const secondaryCtaText = secondaryCta[0] ? secondaryCta[0].children[0] : "";

  const artistModalContent = block.children[block.children.length - 1];
  const previewImageValue = previewImage[0] || "";

  let processedTextContent = "";
  if (mainHeroTextContent) {
    const processElement = (el, isSlideIn) => {
      switch (el.tagName) {
        case "H2": {
          const h1 = document.createElement("h1");
          h1.innerHTML = el.innerHTML;
          h1.classList.add(
            "text-t1",
            isSlideIn ? "hero-slide-text" : "hero-fade-in"
          );
          el.replaceWith(h1);
          break;
        }
        case "P":
          el.classList.add("text-text-white", "text-p1", "split-text");
          break;
        case "H4":
          el.classList.add("text-h2", "hero-fade-in");
          break;
        case "H1":
          if (el.textContent.trim().toUpperCase() === "IMPRINTS") {
            el.innerHTML = `<img class="imprints-logo" src="/icons/imprints-logo.svg" alt="Imprints" />Imprints`;
            return;
          }
          el.classList.add("huge-text", "hero-fade-in");
          break;
        case "H3":
          el.classList.add("text-h1", "hero-fade-in");
          break;
      }
    };

    Array.from(mainHeroTextContent.children).forEach((el) => {
      processElement(el, isSlideInTextValue);
    });

    if (mainHeroTextContent.children.length === 2) {
      if (
        mainHeroTextContent.children[0].tagName === "H1" &&
        mainHeroTextContent.children[1].tagName === "H1"
      ) {
        const h1 = document.createElement("h1");
        const upperSpan = document.createElement("span");
        const lowerSpan = document.createElement("span");
        upperSpan.textContent = mainHeroTextContent.children[0].textContent;
        lowerSpan.textContent = mainHeroTextContent.children[1].textContent;
        upperSpan.className = "hero-slide-text text-t1";
        lowerSpan.className = "hero-slide-text text-t1";
        h1.appendChild(upperSpan);
        h1.appendChild(lowerSpan);
        processedTextContent = h1.outerHTML;
      } else {
        processedTextContent = mainHeroTextContent.innerHTML;
      }
    } else {
      processedTextContent = mainHeroTextContent.innerHTML;
    }
  }

  let openArtistModalFn = null;
  let artistModalData = null;
  if (isArtistValue && artistModalContent.children[0].children.length === 3) {
    artistModalData = showArtistModal(artistModalContent, heroArtistId);
    openArtistModalFn = artistModalData.openModal;
  }

  // Clear and create new structure
  block.textContent = "";
  const parallaxWrapper = document.createElement("section");
  block.append(parallaxWrapper);

  parallaxWrapper.innerHTML = createHeroHTML({
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
    artistId: heroArtistId,
    placeholders,
  });

  const logo = parallaxWrapper.querySelector(".imprints-logo");
  if (logo) {
    gsap.to(logo, {
      opacity: 1,
      duration: 1,
      delay: 0.3, // Delay to allow other animations to start
      ease: "easeInOut",
    });
  }

  // Set up artist card click handler using the new utility function
  if (isArtistValue && openArtistModalFn) {
    setupArtistCardClickHandler(heroArtistId, openArtistModalFn);
  }

  // Handle media blocks and append to hero media container
  const heroMediaContainer = parallaxWrapper.querySelector(
    ".hero-media-container"
  );
  handleMediaBlocks(media, [], heroMediaContainer, false, previewImageValue);

  // Handle modal video if it exists
  if (isVideoCtaValue && video) {
    const modalVideoPadding = parallaxWrapper.querySelector(
      ".video-container-wrapper"
    );
    // Create video element for modal with controls
    handleMediaBlocks(video, [], modalVideoPadding, false);
    // Update the modal video to have controls
    const modalVideo = modalVideoPadding.querySelector("video");
    if (modalVideo) {
      modalVideo.controls = true; // Enable controls in modal
      modalVideo.autoplay = false; // Disable autoplay - will be controlled manually
      modalVideo.className = "modal-video";
      modalVideo.muted = false; // Allow sound in modal
      modalVideo.preload = "metadata"; // Only load metadata, not the full video
    }
  }

  // Setup video modal functionality if needed
  if (isVideoCtaValue) {
    setupVideoModal(parallaxWrapper);
  }

  if (reserveBarValue) {
    hideNavReserveButton();
  }

  // Pass placeholders to setupReservationBar
  setupReservationBar(parallaxWrapper, placeholders);

  if (aiChatInputValue) {
    setTimeout(() => setupAIChatInput(), 1000);
  }

  // Now animate the elements that are actually in the DOM
  requestAnimationFrame(() => {
    animateHeroText(parallaxWrapper);
  });

  // Animate CTA and label elements
  requestAnimationFrame(() => {
    animateHeroElements(parallaxWrapper);
  });

  // Setup parallax after everything is ready
  setTimeout(() => parallaxSection(parallaxWrapper), 500);

  if (aiChatInputValue) {
    if (window.innerWidth <= 767) {
      //hideNavReserveButton(true);
      let isKeyboardOpen = false;

      // Detect keyboard open/close on mobile
      window.visualViewport.addEventListener("resize", () => {
        const newHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        isKeyboardOpen = windowHeight - newHeight > 150;
      });

      window.addEventListener("scroll", () => {
        if (isKeyboardOpen) return;

        const scrollPosition = window.scrollY;
        if (scrollPosition > 250) {
          // const elementToHide = document.querySelectorAll('.hero-ai-chat-input');
          // elementToHide.forEach((element) => element.classList.add("hide"));
          // elementToHide.forEach((element) => element.classList.remove("show"));
          const elementToShow = document.querySelectorAll(
            ".reserve-bar-mobile, .widget-component"
          );
          elementToShow.forEach((element) => element.classList.remove("hide"));
          elementToShow.forEach((element) => element.classList.add("show"));
        } else {
          const elementToHide = document.querySelectorAll(
            ".reserve-bar-mobile, .widget-component"
          );
          elementToHide.forEach((element) => element.classList.add("hide"));
          elementToHide.forEach((element) => element.classList.remove("show"));
          // const elementToShow = document.querySelectorAll('.hero-ai-chat-input');
          // elementToShow.forEach((element) => element.classList.remove("hide"));
          // elementToShow.forEach((element) => element.classList.add("show"));
        }
      });
    }
  }
}
