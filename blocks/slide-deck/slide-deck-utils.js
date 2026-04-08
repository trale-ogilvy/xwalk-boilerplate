import { handleMediaBlocks, createTooltipCard } from "../../scripts/utils.js";
import { createOptimizedPicture } from "../../scripts/aem.js";

const isMobile = window.innerWidth <= 768;

function setupPlaceholderTicker(input, text) {
  let currentIndex = 0;
  let currentCharIndex = text.length;
  let isDeleting = true;
  let typingSpeed = 100;
  let pauseTime = 2000;

  input.placeholder = text;

  function type() {
    if (isDeleting) {
      input.placeholder = text.substring(0, currentCharIndex - 1);
      currentCharIndex--;
      typingSpeed = 50;
    } else {
      input.placeholder = text.substring(0, currentCharIndex + 1);
      currentCharIndex++;
      typingSpeed = 100;
    }

    if (!isDeleting && currentCharIndex === text.length) {
      isDeleting = true;
      typingSpeed = pauseTime;
    } else if (isDeleting && currentCharIndex === 0) {
      isDeleting = false;
      typingSpeed = 500;
    }

    setTimeout(type, typingSpeed);
  }

  type();
}

export function processSlideWithBottomLeftTextAndTooltip(
  slide,
  idx,
  parallaxContainer
) {
  // Extract Content Base
  const slideName = slide.children[0].textContent.trim();
  const mediaContent = slide.children[1].children[0];
  const textContent = slide.children?.[2]?.children?.[0]?.textContent.trim();
  const ctaContent = slide.children?.[2]?.children?.[1]?.children?.[0];
  const showTooltip = slide.children?.[3]?.textContent.trim() === "true";
  const tooltipX = slide.children?.[4]?.children?.[0]?.textContent.trim();
  const tooltipY = slide.children?.[4]?.children?.[1]?.textContent.trim();
  // Card Content
  const imageContent = slide.children?.[5]?.children?.[0];
  const titleContent = slide.children?.[6]?.children?.[0]?.textContent.trim();
  const descriptionContent =
    slide.children?.[6]?.children?.[1]?.textContent.trim();
  // Mobile
  const useMobileContent = slide.children?.[7]?.textContent.trim() === "true";
  const mobileMediaContent = slide.children?.[8]?.children[0];
  const mobileTooltipX =
    slide.children?.[9]?.children[0]?.textContent.trim() || null;
  const mobileTooltipY =
    slide.children?.[9]?.children[1]?.textContent.trim() || null;

  const optimisedMedia = createOptimizedPicture(
    mediaContent.querySelector("img")?.src,
    mediaContent.querySelector("img")?.alt,
    false,
    [
      { media: "(min-width: 1600px)", width: "3200" },
      { media: "(min-width: 1200px)", width: "2400" },
      { media: "(min-width: 900px)", width: "1800" },
      { media: "(min-width: 600px)", width: "1400" },
      { width: "1200" },
    ]
  );
  const optimisedMobileMedia = mobileMediaContent
    ? createOptimizedPicture(
        mobileMediaContent.querySelector("img")?.src,
        mobileMediaContent.querySelector("img")?.alt,
        false,
        [
          { media: "(min-width: 1600px)", width: "3200" },
          { media: "(min-width: 1200px)", width: "2400" },
          { media: "(min-width: 900px)", width: "1800" },
          { media: "(min-width: 600px)", width: "1400" },
          { width: "1200" },
        ]
      )
    : null;

  mediaContent.innerHTML = "";
  mediaContent.appendChild(optimisedMedia);

  const mediaParallaxItem = document.createElement("div");
  mediaParallaxItem.className = "parallax-item";
  mediaParallaxItem.innerHTML = `
  <div class="media-content">
  ${
    useMobileContent && isMobile
      ? `<div class="mobile-media">${
          optimisedMobileMedia
            ? optimisedMobileMedia?.outerHTML
            : optimisedMedia?.outerHTML
        }</div>`
      : ""
  }
          <div class="desktop-media">${optimisedMedia?.outerHTML}</div>
      </div>
  `;
  createTooltipCard({
    parent: mediaParallaxItem,
    componentName: slideName,
    idx,
    tooltipX,
    tooltipY,
    imageContent,
    titleContent,
    descriptionContent,
    showTooltip,
    mobileTooltipX,
    mobileTooltipY,
    mainParent: parallaxContainer,
  });

  const content = `
    <section class="parallax-item slide-with-bottom-left-text-and-tooltip">
    <div class="content">
      <h3 class="text-h3 text-text-white">
        ${textContent}
      </h3>
      ${
        ctaContent
          ? `${`<a href=${ctaContent.getAttribute(
              "href"
            )} class="cta-link text-text-white chevron-right"><span class="animate-underline">${ctaContent.textContent.trim()}</span></a>`}`
          : ""
      }
      </div>

     
    </section>
  `;
  const media = `${mediaParallaxItem.outerHTML} 
      `;

  return { content, media };
}

export function processSlideWithAiCta(slide) {
  const mediaContent = slide.children[1].children;
  const textContent = slide.children?.[2]?.textContent.trim() || "";
  const inputTextContent = slide.children?.[3]?.textContent.trim() || "";
  const aiLink = slide.children?.[4]?.textContent.trim();
  const previewImage = slide.children[5];

  const mediaParallaxItem = document.createElement("div");
  mediaParallaxItem.className = "parallax-item";
  handleMediaBlocks(
    [...mediaContent],
    "",
    mediaParallaxItem,
    true,
    previewImage
  );

  const content = `
    <section class="parallax-item slide-with-ai-cta">
      <h2 class="text-h1 text-text-white">${textContent}</h2>
      <div class="hero-ai-chat-input">
        <div class="ai-chat-icon"><img src="/icons/ai-dots-icon.svg" alt="AI Chat Icon" /></div>
          <input id="ai-chat-slide" type="text" class="ai-chat-input text-l2" placeholder="${
            inputTextContent || ""
          }" />
          <button class="ai-chat-submit-button slide">
            <img src="/icons/arrow.svg" alt="arrow right" />
          </button>
        </div>
    </section>
  `;
  const media = `${mediaParallaxItem.outerHTML}`;
  handleAiInput(inputTextContent, aiLink);

  return { content, media };
}

function handleAiInput(inputTextContent, aiLink) {
  setTimeout(() => {
    const input = document.querySelector("#ai-chat-slide");
    const button = document.querySelector(".ai-chat-submit-button.slide");

    if (inputTextContent) {
      setupPlaceholderTicker(input, inputTextContent);
    }

    const handleSubmit = () => {
      const userInput = input.value.trim();

      const link = aiLink.replace(
        "%7BuserInput%7D",
        encodeURIComponent(userInput)
      );

      window.open(link, "_blank");
    };

    button.addEventListener("click", handleSubmit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    });
  }, 0);
}

export function processNewsletterSlide(slide) {
  const mediaContent = slide.children[1].children;
  const logo = slide.children[2].children[0].children[0];
  const mainText = slide.children[2].children[1].textContent.trim();
  const cta = slide.children[2].children[2].children[0];
  const previewImage = slide.children[3];

  const mediaParallaxItem = document.createElement("div");
  mediaParallaxItem.className = "parallax-item";
  handleMediaBlocks(
    [...mediaContent],
    "",
    mediaParallaxItem,
    true,
    previewImage
  );

  const content = `
    <section class="parallax-item newsletter-slide">
         <div class="overlay-container">
          <div class="logo-wrapper">${logo.innerHTML}</div>
          <h4 class="text-h4 text-text-white">${mainText}</h4>
          <a class="cta-button" href="${cta.getAttribute(
            "href"
          )}">${cta.textContent.trim()}</a>
            </div>
    </section>
  `;
  const media = `${mediaParallaxItem.outerHTML}`;

  return { content, media };
}

export function processSlideWithCenteredContent(slide) {
  const mediaContent = slide.children[1].children;
  const label = slide.children?.[2]?.textContent.trim();
  const header = slide.children?.[3]?.textContent.trim();
  const description = slide.children?.[4]?.textContent.trim();
  const cta = slide.children?.[5]?.children?.[0].children[0];
  const showArrow = slide.children?.[6]?.textContent.trim() === "true";
  const previewImage = slide.children[7];
  const isExternalLink =
    cta?.getAttribute("href") &&
    !cta.getAttribute("href").startsWith("/") &&
    !cta.getAttribute("href").startsWith("#");

  const mediaParallaxItem = document.createElement("div");
  mediaParallaxItem.className = "parallax-item";
  handleMediaBlocks(
    [...mediaContent],
    "",
    mediaParallaxItem,
    true,
    previewImage
  );

  const content = `
    <section class="parallax-item slide-with-centered-content">
        <div class="content-container">
          ${
            label
              ? `<p class="text-l2 text-label text-text-white">${label}</p>`
              : ""
          }
          <h2 class="text-h1 text-title text-text-white">${header}</h2>
          ${
            description
              ? `<p class="text-p1 text-desc text-text-white">${description}</p>`
              : ""
          }
         ${
           cta?.textContent.trim()
             ? `<a class="cta-link text-text-white ${
                 showArrow ? "chevron-right" : ""
               }" href="${cta?.getAttribute("href")}" target=${
                 isExternalLink ? "_blank" : "_self"
               }><span class="animate-underline">${cta?.textContent.trim()}</span></a>`
             : ""
         }
            </div>
    </section>
  `;
  const media = `${mediaParallaxItem.outerHTML}`;

  return { content, media };
}
export function processSlideWithLeftAndRightContent(slide) {
  const mediaContent = slide.children[1].children;
  const header = slide.children?.[2]?.textContent.trim();
  const rightContentRichText = slide.children?.[3];
  const previewImage = slide?.children?.[4];

  const mediaParallaxItem = document.createElement("div");
  mediaParallaxItem.className = "parallax-item";
  handleMediaBlocks(
    [...mediaContent],
    "",
    mediaParallaxItem,
    true,
    previewImage
  );

  const content = `
    <section class="parallax-item slide-with-left-and-right-content">
      <div class="content-container">
        <div class="content-wrapper">
          <h2 class="text-h1 text-text-white left-content">${header}</h2>
          <div class="right-content text-text-white">${rightContentRichText.innerHTML}</div>
        </div>
      </div>
    </section>
  `;
  const media = `${mediaParallaxItem.outerHTML}`;

  return { content, media };
}

export function handleEditorEnv(slides) {
  slides.forEach((slide) => {
    const slideType = slide.children[0].textContent.trim();
    switch (slideType) {
      case "slide-with-bottom-left-text-and-tooltip": {
        slide.className = "slide-with-bottom-left-text-and-tooltip";
        const desktopCoordinates = slide.children[4];
        desktopCoordinates.style.left = `${desktopCoordinates.children[0].textContent.trim()}%`;
        desktopCoordinates.style.top = `${desktopCoordinates.children[1].textContent.trim()}%`;

        const mobileCoordinates = slide.children[9];
        mobileCoordinates.style.left = `${mobileCoordinates?.children?.[0]?.textContent.trim()}%`;
        mobileCoordinates.style.top = `${mobileCoordinates?.children?.[1]?.textContent.trim()}%`;

        const showTooltip = slide.children[3];
        const tooltipCard = slide.children[5];
        const tooltipContent = slide.children[6];
        tooltipCard.appendChild(tooltipContent);
        if (showTooltip.textContent.trim() !== "true") {
          tooltipCard.style.display = "none";
        }
        break;
      }
      case "slide-with-ai-cta": {
        slide.className = "slide-with-ai-cta";
        const media = slide.children[1];
        const previewImg = slide.children[5];
        previewImg.classList.add("preview-image");
        handleMediaBlocks([...media.children], "", slide);
        break;
      }
      case "newsletter-slide": {
        slide.className = "newsletter-slide";
        const media = slide.children[1];
        const previewImg = slide.children[3];
        previewImg.classList.add("preview-image");
        handleMediaBlocks([...media.children], "", slide);
        break;
      }
      case "slide-with-centered-content": {
        slide.className = "slide-with-centered-content";

        const contentContainer = document.createElement("div");
        contentContainer.className = "content-container";
        const contents = [...slide.children].slice(2);
        contents.forEach((content) => {
          contentContainer.appendChild(content);
        });
        const previewImg = contents[5];
        previewImg.classList.add("preview-image");
        slide.appendChild(contentContainer);

        const showArrow =
          contents[contents.length - 1].textContent.trim() === "true";
        if (showArrow) {
          const cta = contents[contents.length - 2].children[0].children[0];
          cta.classList.add("chevron-right");
        }

        const media = slide.children[1];
        handleMediaBlocks([...media.children], "", slide);
        break;
      }
      case "slide-with-left-and-right-content": {
        slide.className = "slide-with-left-and-right-content";

        const contentWrapper = document.createElement("div");
        contentWrapper.className = "content-wrapper";
        const leftContent = slide.children[2];
        const rightContent = slide.children[3];
        const previewImg = slide.children[4];
        previewImg.classList.add("preview-image");
        contentWrapper.appendChild(leftContent);
        contentWrapper.appendChild(rightContent);
        slide.appendChild(contentWrapper);

        const media = slide.children[1];
        handleMediaBlocks([...media.children], "", slide);
        break;
      }
      default:
        break;
    }
  });
}
