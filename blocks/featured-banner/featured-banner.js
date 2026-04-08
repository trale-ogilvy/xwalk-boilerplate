import { getElements, formatDateBox } from "../../scripts/utils.js";
import { createOptimizedPicture } from "../../scripts/aem.js";
import { moveInstrumentation } from "../../scripts/scripts.js";

function setupHoverEffects(block) {
  const imageContainer = block.querySelector(".banner-image");
  const ctaLink = block.querySelector(".cta-link");

  if (imageContainer && ctaLink) {
    // Desktop hover behavior - only add hover class to image when hovering on link
    ctaLink.addEventListener("mouseenter", () => {
      imageContainer.classList.add("hovered");
    });

    ctaLink.addEventListener("mouseleave", () => {
      imageContainer.classList.remove("hovered");
    });
  }
}

export default async function decorate(block) {
  const selectors = [
    { key: "image", sel: ":scope > div:nth-child(1) > div" },
    {
      key: "showDate",
      sel: ":scope > div:nth-child(2) > div > p:nth-child(1)",
    },
    {
      key: "startDate",
      sel: ":scope > div:nth-child(2) > div > p:nth-child(2)",
    },
    { key: "endDate", sel: ":scope > div:nth-child(2) > div > p:nth-child(3)" },
    { key: "label", sel: ":scope > div:nth-child(3) > div > p" },
    { key: "title", sel: ":scope > div:nth-child(4) > div > p" },
    { key: "description", sel: ":scope > div:nth-child(5) > div > p" },
    {
      key: "ctaLink",
      sel: ":scope > div:nth-child(6) > div > p.button-container > a",
    },
    { key: "isExternalLink", sel: ":scope > div:nth-child(7) > div > p" },

    {
      key: "secondCtaLink",
      sel: ":scope > div:nth-child(8) > div > p.button-container > a",
    },
    { key: "secondIsExternalLink", sel: ":scope > div:nth-child(9) > div > p" },
    { key: "mobileImage", sel: ":scope > div:nth-child(10) > div" },
  ];

  // Extract elements using the utility function
  const elements = getElements(block, selectors);

  // Store the extracted content in variables
  const image =
    elements.image[0]?.querySelector("picture") ||
    elements.image[0]?.querySelector("img");
  const mobileImage =
    elements.mobileImage[0]?.querySelector("picture") ||
    elements.mobileImage[0]?.querySelector("img");
  const optimizedPic = createOptimizedPicture(
    elements.image[0]?.querySelector("img").src,
    elements.image[0]?.querySelector("img").alt,
    false,
    [
      { media: "(min-width: 1600px)", width: "3200" },
      { media: "(min-width: 1200px)", width: "2400" },
      { media: "(min-width: 900px)", width: "1800" },
      { media: "(min-width: 600px)", width: "1400" },
      { width: "1200" },
    ]
  );

  const optimizedPicMobile = createOptimizedPicture(
    elements.mobileImage[0]?.querySelector("img").src,
    elements.mobileImage[0]?.querySelector("img").alt,
    false,
    [
      { media: "(min-width: 600px)", width: "1400" },
      { width: "1200" },
    ]
  );
  moveInstrumentation(image, optimizedPic.querySelector("img"));
  const startDate = elements.startDate[0]?.textContent;
  const endDate = elements.endDate[0]?.textContent;
  const label = elements.label[0]?.textContent;
  const title = elements.title[0]?.textContent;
  const description = elements.description[0]?.textContent;
  const ctaLink = elements.ctaLink[0];
  const isExternalLink =
    elements.isExternalLink[0]?.textContent.trim() === "true" || false;
  const showDate = elements.showDate[0]?.textContent.trim() === "true" || false;

  const secondCtaLink = elements.secondCtaLink[0];
  const secondIsExternalLink =
    elements.secondIsExternalLink[0]?.textContent.trim() === "true" || false;

  // Add custom class to CTA button if it exists
  if (ctaLink) {
    ctaLink.classList.add("cta-link", "animate-underline");

    // Handle external links
    if (isExternalLink) {
      ctaLink.setAttribute("target", "_blank");
      ctaLink.setAttribute("rel", "noopener noreferrer");
    }
  }

  if (secondCtaLink) {
    const originalText = secondCtaLink.textContent;

    secondCtaLink.classList.add("cta-link", "secondary-banner-chevron");

    secondCtaLink.innerHTML = `<span class="animate-underline">${originalText}</span>`;

    if (secondIsExternalLink) {
      secondCtaLink.setAttribute("target", "_blank");
      secondCtaLink.setAttribute("rel", "noopener noreferrer");
    }
  }

  const dateBoxHTML = showDate ? formatDateBox(startDate, endDate) : "";

  // Create the HTML structure for the featured banner
  const featuredBannerHTML = `
      <div class="banner-image">
        ${image ? optimizedPic.outerHTML : ""}
        ${mobileImage ? `<div class="mobile-image">${optimizedPicMobile.outerHTML}</div>` : ""}
      </div>
      <div class="banner-content text-text-white">
        <p class="banner-label text-l2">${label || ""}</p>
        <div class="banner-header">
          ${dateBoxHTML}
          <h2 class="banner-title text-t4">${title || ""}</h2>
        </div>
        <p class="banner-description text-p1">${description || ""}</p>
        <div class="banner-cta-wrapper">
          ${ctaLink ? ctaLink.outerHTML : ""}
          ${
            secondCtaLink
              ? `<div class="cta-divider"></div>${secondCtaLink.outerHTML}`
              : ""
          }
        </div>
      </div>
  `;

  // Clear the block content and append the new HTML
  block.textContent = "";
  block.innerHTML = featuredBannerHTML;

  // Setup hover effects after DOM is created
  setupHoverEffects(block);
}
