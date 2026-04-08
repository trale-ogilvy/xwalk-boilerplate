import { parallaxSection } from "../../scripts/animations.js";
import {
  handleMediaBlocks,
  getElements,
  setupParallaxEffect,
  showArtistModal,
  createArtistCard,
  setupArtistCardClickHandler,
} from "../../scripts/utils.js";
import { isUniversalEditor } from "../../scripts/aem.js";
import { loadCSS } from "../../scripts/aem.js";
import {
  createMusicPlayer,
  setupVideoAutoplay,
  handleMusicPlayer,
} from "./slider-teaser-utils.js";

const sliderTeaserSection = document.querySelectorAll(
  ".slider-teaser-content-container"
);

function sliderTeaser() {
  if (isUniversalEditor()) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/slider-teaser-content/slider-teaser-content-author.css`
    );

    return;
  }
  sliderTeaserSection.forEach((section) => {
    const sectionContent = Array.from(section.children);
    while (section.firstChild) {
      section.removeChild(section.firstChild);
    }

    const sliderTeaserContent = sectionContent.filter((child) =>
      child.classList.contains("slider-teaser-content-wrapper")
    );

    const parallaxWrapper = document.createElement("section");
    section.appendChild(parallaxWrapper);
    const parallaxContainer = document.createElement("section");
    parallaxContainer.className = "parallax-container";
    parallaxWrapper.appendChild(parallaxContainer);

    const parallaxContent = document.createElement("div");
    const parallaxMedia = document.createElement("div");
    parallaxContent.className = "parallax-content";
    parallaxMedia.className = "parallax-media";
    parallaxContainer.appendChild(parallaxMedia);
    parallaxContainer.appendChild(parallaxContent); // Each Slide
    const slides = [...sliderTeaserContent];
    slides.forEach((slide, slideIndex) => {
      const slideRows = slide.children[0];
      // ...existing code...

      // Generate unique ID for this slide's artist
      const artistId = `slider-artist-${slideIndex}-${Date.now()}`;

      // ...existing code...
      const selectors = [
        {
          key: "overlay",
          sel: ":scope > div:nth-child(1) > div",
        },
        {
          key: "overlayText",
          sel: ":scope > div:nth-child(2) > div > p",
        },
        {
          key: "overlayButtonText",
          sel: ":scope > div:nth-child(3) > div > p",
        },
        {
          key: "overlayButtonUrl",
          sel: ":scope > div:nth-child(4) > div > p",
        },
        {
          key: "labelText",
          sel: ":scope > div:nth-child(5) > div > p",
        },
        {
          key: "titleText",
          sel: ":scope > div:nth-child(6) > div > p",
        },
        {
          key: "descriptionText",
          sel: ":scope > div:nth-child(7) > div > p",
        },
        {
          key: "ctaText",
          sel: ":scope > div:nth-child(8) > div > p",
        },
        {
          key: "ctaUrl",
          sel: ":scope > div:nth-child(9) > div > p",
        },
        {
          key: "isExternalLink",
          sel: ":scope > div:nth-child(10) > div > p",
        },
        {
          key: "media",
          sel: ":scope > div:nth-child(11) > div",
        },
        {
          key: "imgAltText",
          sel: ":scope > div:nth-child(12) > div > p",
        },
        {
          key: "logo",
          sel: ":scope > div:nth-child(13) > div",
        },
        {
          key: "isArtist",
          sel: ":scope > div:nth-child(14) > div",
        },
        {
          key: "artistName",
          sel: ":scope > div:nth-child(15) > div > p",
        },
        {
          key: "artistImage",
          sel: ":scope > div:nth-child(16) > div",
        },
        {
          key: "musicPlayer",
          sel: ":scope > div:nth-child(17) > div > p",
        },
        {
          key: "musicThumbnail",
          sel: ":scope > div:nth-child(18) > div > picture",
        },
        {
          key: "musicArtist",
          sel: ":scope > div:nth-child(19) > div > p",
        },

        {
          key: "musicSong",
          sel: ":scope > div:nth-child(20) > div > p > a",
        },
        {
          key: "previewImage",
          sel: ":scope > div:last-child > div",
        },
      ];
      const elements = getElements(slideRows, selectors);
      const {
        overlay,
        overlayText,
        overlayButtonText,
        overlayButtonUrl,
        labelText,
        titleText,
        descriptionText,
        ctaText,
        ctaUrl,
        isExternalLink,
        media,
        imgAltText,
        logo,
        isArtist,
        artistName,
        artistImage,
        musicPlayer,
        musicThumbnail,
        musicArtist,
        musicSong,
        previewImage,
      } = elements;

      const artistModalContent =
        slideRows.children[[slideRows.children.length - 1]];

      /* ------------------------------ Fields Value ------------------------------ */
      // Overlay Items
      const isOverlay = overlay[0].textContent.trim() === "true";
      const overlayTextValue = overlayText[0]?.textContent.trim() || "";
      const overlayButtonTextValue =
        overlayButtonText[0]?.textContent.trim() || "";
      const overlayButtonUrlValue =
        overlayButtonUrl[0]?.textContent.trim() || "";

      const labelTextValue = labelText[0]?.textContent.trim() || "";
      const titleTextValue = titleText[0]?.textContent.trim() || "";
      const descriptionTextValue = descriptionText[0]?.textContent.trim() || "";
      const ctaTextValue = ctaText[0]?.textContent.trim() || "";
      const ctaUrlValue = ctaUrl[0]?.textContent.trim() || "";
      const isExternalLinkValue =
        isExternalLink[0]?.textContent.trim() === "true" || false;

      const logoValue = logo[0].children[0];
      // Artist Items
      const isArtistValue = isArtist[0]?.textContent.trim() === "true" || false;
      const artistNameValue = artistName[0]?.textContent.trim() || "";
      const artistImageValue = artistImage[0].children[0];
      // Music Player Items
      const musicPlayerValue = musicPlayer[0]?.textContent.trim() === "true";
      const musicThumbnailValue = musicThumbnail[0];
      const musicArtistValue = musicArtist[0]?.textContent.trim() || "";
      const musicSongTitleValue = musicSong[0]?.getAttribute("title") || "";
      const musicSongValue = musicSong[0]?.getAttribute("href") || "";
      const previewImageValue = previewImage[0]?.querySelector("picture")
        ? previewImage[0]
        : "";

      const infoItemValue =
        slideRows
          .querySelector(":scope > div:nth-child(21) > div > p")
          ?.textContent.trim() === "true";
      const infotitleValue =
        slideRows
          .querySelector(":scope > div:nth-child(22) > div > p")
          ?.textContent.trim() || "";

      let featuresHtml = "";
      for (let i = 0; i < 3; i++) {
        const iconDiv = slideRows.querySelector(
          `:scope > div:nth-child(${23 + i * 2}) > div picture`
        );
        const descP = slideRows.querySelector(
          `:scope > div:nth-child(${24 + i * 2}) > div > p`
        );
        if (iconDiv || descP) {
          featuresHtml += `
            <div class="info-item-feature">
              <div class="info-item-feature-icon">
                ${iconDiv ? iconDiv.outerHTML : ""}
              </div>
              <div class="info-item-feature-text">
                ${descP ? descP.outerHTML : ""}
              </div>
            </div>
          `;
        }
      }

      let infoItemHtml = "";
      if (infoItemValue) {
        infoItemHtml = `
          <div class="info-item-wrapper">
            <div class="info-item">
              ${
                infotitleValue
                  ? `<h1 class="info-title">${infotitleValue}</h1>`
                  : ""
              }
              <div class="info-item-features">
                ${featuresHtml}
              </div>
            </div>
          </div>
        `;
      }
      const mediaParallaxItem = document.createElement("div");
      handleMediaBlocks(
        media,
        imgAltText,
        mediaParallaxItem,
        "true",
        previewImageValue
      );

      let musicCard = null;
      if (musicPlayerValue && musicSongValue) {
        musicCard = createMusicPlayer({
          songSrc: musicSongValue,
          artist: musicArtistValue,
          title: musicSongTitleValue,
          thumbnail: musicThumbnailValue,
        });
      }

      let openArtistModalFn = null;
      let artistModalData = null;
      if (
        isArtistValue &&
        artistModalContent.children[0].children.length === 3
      ) {
        artistModalData = showArtistModal(artistModalContent, artistId);
        openArtistModalFn = artistModalData.openModal;
      }

      // Use utility for video autoplay
      const videoEl = mediaParallaxItem.querySelector("video");
      if (videoEl) {
        setupVideoAutoplay(videoEl);
      }

      function isSameDomain(url) {
        try {
          const link = new URL(url, window.location.origin);
          return link.hostname === window.location.hostname;
        } catch {
          return false;
        }
      }

      // Build parallax media/content
      parallaxMedia.innerHTML += `
      <div class="parallax-item active">
        ${mediaParallaxItem.innerHTML}
      </div>
    `;

      parallaxContent.innerHTML += `
        <div class="parallax-item">
          ${
            isOverlay
              ? `
            <div class="overlay-container">
          <div class="logo-wrapper">${logoValue.innerHTML}</div>
          <h4 class="text-h4 text-text-white">${overlayTextValue}</h4>
          <a class="cta-button" href="${overlayButtonUrlValue}">${overlayButtonTextValue}</a>
            </div>
          `
              : `
            <div class="base-container">
          ${
            labelTextValue
              ? `<p class="text-l2 text-label text-text-white">${labelTextValue}</p>`
              : ""
          }
          <h2 class="text-h1 text-title text-text-white">${titleTextValue}</h2>
          ${
            descriptionTextValue
              ? `<p class="text-p1 text-text-white">${descriptionTextValue}</p>`
              : ""
          }
         ${
           ctaUrlValue && ctaTextValue
             ? `<a class="cta-link text-text-white ${
                 isExternalLinkValue ||
                 !isSameDomain(ctaUrlValue) ||
                 ctaTextValue
                   .toLowerCase()
                   .includes("reserve your experience") ||
                 ctaTextValue.toLowerCase().includes("make an enquiry") ||
                 ctaUrlValue.includes("reservemodal") ||
                 ctaUrlValue.includes("reserveModal") ||
                 ctaUrlValue.includes("reserve-hub")
                   ? isExternalLinkValue
                     ? "external-link-a"
                     : "chevron-right"
                   : isExternalLinkValue
                   ? "external-link-a"
                   : ""
               }" href="${ctaUrlValue}" target=${
                 isExternalLinkValue ||
                 !isSameDomain(ctaUrlValue) ||
                 ctaTextValue.toLowerCase().includes("reserve your experience")
                   ? "_blank"
                   : "_self"
               }><span class="animate-underline">${ctaTextValue}</span></a>`
             : ""
         }
            </div>
          `
          }
        ${
          musicPlayerValue && musicSongValue && musicCard
            ? musicCard.outerHTML
            : ""
        }
          ${
            isArtistValue
              ? createArtistCard(
                  artistImageValue.innerHTML,
                  artistNameValue,
                  artistId
                )
              : ""
          }
          ${infoItemHtml}
        </div>
      `;

      // Set up artist card click handler using the new utility function
      if (isArtistValue && openArtistModalFn) {
        setupArtistCardClickHandler(artistId, openArtistModalFn);
      }

      parallaxContainer.appendChild(parallaxContent);
    });

    handleMusicPlayer(parallaxContainer);
    // Parallax effect
    if (slides.length === 1) {
      setTimeout(() => parallaxSection(parallaxWrapper), 100);
    } else {
      setupParallaxEffect(parallaxContainer, parallaxContent, parallaxMedia);
    }
  });
}

sliderTeaser();
