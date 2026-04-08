import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import { loadSwiper } from "../../scripts/utils.js";
import { handleProfileCardTrigger } from "../carousel-card-popup/carousel-card-popup.js";

function handleAuthoringEnvironment(block, cards) {
  loadCSS(
    `${window.hlx.codeBasePath}/blocks/carousel-container/carousel-container-author.css`
  );

  block.innerHTML = "";

  const authoringWrapper = document.createElement("div");
  authoringWrapper.className = "authoring-wrapper";

  cards.forEach((row) => authoringWrapper.append(row));
  block.append(authoringWrapper);
}

async function handleLiveEnvironment(block, cards) {
  function createArrowButton(direction) {
    const arrow = document.createElement("button");
    arrow.className = `swiper-arrow-button ${direction}-arrow`;
    arrow.setAttribute(
      "aria-label",
      direction === "left" ? "Previous slide" : "Next slide"
    );
    arrow.style.pointerEvents = "auto";
    arrow.style.opacity = direction === "left" ? "0" : "1";
    arrow.style.transition = "opacity 300ms";
    arrow.style.position = "absolute";
    arrow.style[direction] = "20px";
    arrow.style.top = "50%";
    arrow.style.transform = "translateY(-50%)";
    const icon = document.createElement("div");
    icon.className = "arrow-icon";
    if (direction === "right") icon.style.transform = "rotate(180deg)";
    arrow.appendChild(icon);
    return arrow;
  }

  function needsSwiper(swiperContainer) {
    const wrapper = swiperContainer.querySelector(".swiper-wrapper");
    const slides = wrapper.querySelectorAll(".swiper-slide");
    if (!slides.length) return false;
    const containerWidth = swiperContainer.clientWidth;
    const originalDisplay = wrapper.style.display;
    const originalTransform = wrapper.style.transform;
    wrapper.style.display = "flex";
    wrapper.style.transform = "none";
    const viewportWidth = window.innerWidth;
    const gap = viewportWidth < 768 ? 16 : viewportWidth < 1024 ? 24 : 32;
    wrapper.style.gap = `${gap}px`;
    wrapper.offsetWidth;
    let totalContentWidth = 0;
    slides.forEach((slide) => {
      totalContentWidth += slide.offsetWidth;
    });
    if (slides.length > 1) {
      totalContentWidth += gap * (slides.length - 1);
    }
    wrapper.style.display = originalDisplay;
    wrapper.style.transform = originalTransform;
    wrapper.style.gap = "";
    const buffer = 20;
    return totalContentWidth > containerWidth + buffer;
  }

  function initializeSwiper(
    swiperContainer,
    arrowsContainer,
    imageContainers,
    enableSwiper = true
  ) {
    const leftArrow = createArrowButton("left");
    const rightArrow = createArrowButton("right");
    arrowsContainer.append(leftArrow, rightArrow);

    const swiper = new Swiper(swiperContainer, {
      slidesPerView: "auto",
      freeMode: enableSwiper,
      keyboard: { enabled: enableSwiper, onlyInViewport: true },
      watchOverflow: true,
      preventClicksPropagation: true,
      resistance: enableSwiper,
      slidesOffsetAfter: 0,
      resistanceRatio: enableSwiper ? 0.85 : 0,
      mousewheel: enableSwiper ? { forceToAxis: true } : false,
      allowSlideNext: enableSwiper,
      allowSlidePrev: enableSwiper,
      navigation: enableSwiper
        ? { nextEl: rightArrow, prevEl: leftArrow }
        : false,
      breakpoints: {
        0: { slidesPerView: "auto", spaceBetween: 24 },
        768: { slidesPerView: "auto", spaceBetween: 24 },
        1024: { slidesPerView: "auto", spaceBetween: 32 },
      },
      on: {
        init: (s) => updateArrowsHeight(s),
        resize: (s) => updateArrowsHeight(s),
        progress: (s) => updateArrowsHeight(s),
        reachEnd: (s) => updateArrowsHeight(s),
        reachBeginning: (s) => updateArrowsHeight(s),
      },
    });

    function updateArrowsHeight(swiperInstance) {
      if (!imageContainers.length) return;
      const activeIndex = swiperInstance.activeIndex;
      const activeImageContainer = imageContainers[activeIndex];
      if (!activeImageContainer) return;
      const imageHeight = activeImageContainer.clientHeight;
      arrowsContainer.style.height = `${imageHeight}px`;
      if (enableSwiper) {
        leftArrow.style.opacity = swiperInstance.isBeginning ? "0" : "1";
        rightArrow.style.opacity = swiperInstance.isEnd ? "0" : "1";
        leftArrow.style.pointerEvents = swiperInstance.isBeginning
          ? "none"
          : "auto";
        rightArrow.style.pointerEvents = swiperInstance.isEnd ? "none" : "auto";
      } else {
        leftArrow.style.opacity = "0";
        rightArrow.style.opacity = "0";
        leftArrow.style.pointerEvents = "none";
        rightArrow.style.pointerEvents = "none";
      }
    }

    function handleImageLoad() {
      updateArrowsHeight(swiper);
    }

    imageContainers.forEach((container) => {
      const img = container.querySelector("img");
      if (img) {
        if (img.complete) {
          handleImageLoad();
        } else {
          img.addEventListener("load", handleImageLoad);
        }
      }
    });

    setTimeout(() => updateArrowsHeight(swiper), 100);

    if (!enableSwiper) {
      arrowsContainer.style.display = "none";
    }
    return swiper;
  }

  block.classList.add("swiper-block-container");
  block.style.position = "relative";
  block.innerHTML = "";

  const arrowsContainer = document.createElement("div");
  arrowsContainer.className = "swiper-arrows-container";
  arrowsContainer.style.position = "absolute";
  arrowsContainer.style.top = "0";
  arrowsContainer.style.left = "0";
  arrowsContainer.style.right = "0";
  arrowsContainer.style.zIndex = "20";
  arrowsContainer.style.pointerEvents = "none";

  const swiperContainer = document.createElement("div");
  swiperContainer.className = "swiper-container";

  const swiperWrapper = document.createElement("div");
  swiperWrapper.className = "swiper-wrapper";

  const imageContainers = [];

  cards.forEach((card) => {
    if (!card.textContent.trim() && !card.querySelector("picture")) {
      return;
    }

    const newSlide = document.createElement("div");
    newSlide.className = "swiper-slide";

    const cardContainer = document.createElement("div");
    cardContainer.className = "card";

    const cells = [...card.children];
    const isFirstChildFlag =
      cells[0]?.textContent.trim().toLowerCase() === "true" ||
      cells[0]?.textContent.trim().toLowerCase() === "false";
    const isImageInCell3 = cells[3]?.querySelector("picture");
    const isSquareFlag = cells[0]?.textContent.trim().toLowerCase() === "true";
    const titleCell = isFirstChildFlag ? cells[1] : cells[0];
    const descriptionCell = isImageInCell3 ? cells[2] : cells[1];
    const pictureCell = isImageInCell3 ? cells[3] : cells[2];
    const buttonTextCell = cells[5];
    const buttonLinkCell = cells[6];
    const labelTagCell = cells[7];
    const popupTitleCell = cells[8];
    const dateRangeCell = cells[9];
    const timeRangeCell = cells[10];
    const locationCell = cells[11];
    const dedicatedDescriptionCell = cells[12];

    const picture = pictureCell?.querySelector("picture");
    if (picture) {
      const imageWrapper = document.createElement("div");
      imageWrapper.className = "image-container";
      imageWrapper.classList.add(isSquareFlag ? "is-square" : "is-standard");
      imageWrapper.appendChild(picture.cloneNode(true));
      cardContainer.appendChild(imageWrapper);
      imageContainers.push(imageWrapper);
    }

    if (titleCell?.textContent.trim()) {
      const titleEl = document.createElement("div");
      titleEl.className = "card-title-swiper text-h2";
      titleEl.innerHTML = titleCell.innerHTML;
      cardContainer.append(titleEl);
    }

    const descriptionContentForCard = descriptionCell?.innerHTML || "";
    if (descriptionContentForCard) {
      const descEl = document.createElement("div");
      descEl.className = "card-description-swiper";
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = descriptionContentForCard;
      const children = Array.from(tempDiv.children);
      children.forEach((child) => {
        const paragraphWrapper = document.createElement("div");
        paragraphWrapper.className = "text-p1 paragraph-item";
        paragraphWrapper.appendChild(child.cloneNode(true));
        descEl.appendChild(paragraphWrapper);
      });
      if (children.length === 0 && descriptionContentForCard.trim()) {
        const paragraphWrapper = document.createElement("div");
        paragraphWrapper.className = "text-p1 paragraph-item";
        paragraphWrapper.innerHTML = descriptionContentForCard;
        descEl.appendChild(paragraphWrapper);
      }
      cardContainer.append(descEl);
    }

    const buttonText = buttonTextCell?.textContent.trim();
    const buttonLink = buttonLinkCell?.querySelector("a")?.href;

    if (buttonText && buttonLink) {
      const button = document.createElement("a");
      button.href = buttonLink;
      button.className = "card-button-swiper";
      button.textContent = buttonText;
      const cleanLink = buttonLink.split("?")[0];
      const isProfileCardLink = /\/profilecard$/i.test(cleanLink);
      if (isProfileCardLink) {
        loadCSS(
          `${window.hlx.codeBasePath}/blocks/carousel-card-popup/carousel-card-popup.css`
        );
        import("../carousel-card-popup/carousel-card-popup.js");
        const handleButtonClick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const cardData = {
            title: titleCell?.textContent.trim() || "",
            description: descriptionCell?.innerHTML || "",
            dedicatedDescription:
              dedicatedDescriptionCell?.innerHTML.trim() || "",
            image: picture?.querySelector("img")?.src || null,
            labelTag: labelTagCell?.textContent.trim() || "",
            popupTitle: popupTitleCell?.textContent.trim() || "",
            dateRange: dateRangeCell?.textContent.trim() || "",
            timeRange: timeRangeCell?.textContent.trim() || "",
            location: locationCell?.textContent.trim() || "",
            source: {
              title: titleCell,
              description: descriptionCell,
              image: pictureCell,
              labelTag: labelTagCell,
              popupTitle: popupTitleCell,
              dateRange: dateRangeCell,
              timeRange: timeRangeCell,
              location: locationCell,
              dedicatedDescription: dedicatedDescriptionCell,
            },
          };
          handleProfileCardTrigger(e, { cardData });
        };
        button.addEventListener("click", handleButtonClick);
        button.addEventListener("touchend", handleButtonClick);
      }
      const buttonContainer = document.createElement("div");
      buttonContainer.className = "card-button-container";
      buttonContainer.appendChild(button);
      cardContainer.appendChild(buttonContainer);
    }

    newSlide.appendChild(cardContainer);
    swiperWrapper.appendChild(newSlide);
  });

  swiperContainer.appendChild(swiperWrapper);
  block.appendChild(arrowsContainer);
  block.appendChild(swiperContainer);

  try {
    await loadSwiper();
    let swiperInstance = null;
    let currentSwiperEnabled = null;
    function checkAndUpdateSwiper() {
      const shouldEnableSwiper = needsSwiper(swiperContainer);
      if (swiperInstance === null) {
        swiperInstance = initializeSwiper(
          swiperContainer,
          arrowsContainer,
          imageContainers,
          shouldEnableSwiper
        );
        currentSwiperEnabled = shouldEnableSwiper;
      } else if (currentSwiperEnabled !== shouldEnableSwiper) {
        swiperInstance.allowSlideNext = shouldEnableSwiper;
        swiperInstance.allowSlidePrev = shouldEnableSwiper;
        if (shouldEnableSwiper) {
          swiperInstance.navigation.init();
          swiperInstance.navigation.update();
          swiperInstance.keyboard.enable();
          swiperInstance.mousewheel.enable();
          arrowsContainer.style.display = "block";
        } else {
          swiperInstance.navigation.destroy();
          swiperInstance.keyboard.disable();
          swiperInstance.mousewheel.disable();
          arrowsContainer.style.display = "none";
          swiperInstance.slideTo(0, 0);
        }
        currentSwiperEnabled = shouldEnableSwiper;
      }
    }
    setTimeout(checkAndUpdateSwiper, 100);
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        checkAndUpdateSwiper();
      }, 250);
    });
  } catch (error) {
    console.error("Swiper initialization failed:", error);
  }
}

export default async function decorate(block) {
  const cards = [...block.children];

  if (isUniversalEditor()) {
    handleAuthoringEnvironment(block, cards);
  } else {
    await handleLiveEnvironment(block, cards);
  }
}
