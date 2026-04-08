import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import {
  processSlideWithAiCta,
  processSlideWithBottomLeftTextAndTooltip,
  processNewsletterSlide,
  processSlideWithCenteredContent,
  processSlideWithLeftAndRightContent,
  handleEditorEnv,
} from "./slide-deck-utils.js";
import { setupParallaxEffect } from "../../scripts/utils.js";
import { parallaxSection } from "../../scripts/animations.js";

export default async function decorate(block) {
  console.log("Decorate slide-deck");
  if (isUniversalEditor()) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/slide-deck/slide-deck-author.css`
    );
    const slides = [...block.children];
    handleEditorEnv(slides);
    return;
  }

  const parallaxContainer = document.createElement("div");
  parallaxContainer.className = "parallax-container";

  const parallaxContent = document.createElement("div");
  const parallaxMedia = document.createElement("div");
  parallaxContent.className = "parallax-content";
  parallaxMedia.className = "parallax-media";

  parallaxContainer.appendChild(parallaxContent);
  parallaxContainer.appendChild(parallaxMedia);

  const slides = [...block.children];
  slides.forEach((slide, idx) => {
    const slideType = slide.children[0].textContent.trim();
    switch (slideType) {
      case "slide-with-bottom-left-text-and-tooltip": {
        const { content, media } = processSlideWithBottomLeftTextAndTooltip(
          slide,
          idx,
          parallaxContainer
        );
        parallaxContent.innerHTML += content;
        parallaxMedia.innerHTML += media;
        break;
      }
      case "slide-with-ai-cta": {
        const { content, media } = processSlideWithAiCta(slide);
        parallaxContent.innerHTML += content;
        parallaxMedia.innerHTML += media;
        break;
      }
      case "newsletter-slide": {
        const { content, media } = processNewsletterSlide(slide);
        parallaxContent.innerHTML += content;
        parallaxMedia.innerHTML += media;
        break;
      }
      case "slide-with-centered-content": {
        const { content, media } = processSlideWithCenteredContent(slide);
        parallaxContent.innerHTML += content;
        parallaxMedia.innerHTML += media;
        break;
      }
      case "slide-with-left-and-right-content": {
        const { content, media } = processSlideWithLeftAndRightContent(slide);
        parallaxContent.innerHTML += content;
        parallaxMedia.innerHTML += media;
        break;
      }
      default:
        break;
    }
  });

  block.innerHTML = "";
  block.appendChild(parallaxContainer);

  if (slides.length === 1) {
    const parallaxItem = parallaxMedia.querySelector(".parallax-item");
    parallaxItem.style.opacity = "1";
    setTimeout(() => parallaxSection(block), 100);
  } else {
    setupParallaxEffect(parallaxContainer, parallaxContent, parallaxMedia);
  }
}
