import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import { loadSwiper, createTooltipCard } from "../../scripts/utils.js";
import { handleEditorEnv } from "./large-carousel-with-tooltip-utils.js";

function updateImageUrlWidth(url, newWidth) {
  if (!url) return url;
  try {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set("width", newWidth);
    return urlObj.toString();
  } catch (e) {
    console.warn("Invalid URL for image width update:", url, e);
    return url;
  }
}

export default async function decorate(block) {
  if (isUniversalEditor()) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/large-carousel-with-tooltip/large-carousel-with-tooltip-author.css`
    );
    const slides = [...block.children];
    handleEditorEnv(slides);
    return;
  }

  const isLiveMode = !isUniversalEditor();

  block.classList.add("large-carousel-with-tooltip");

  const originalBlockInstrumentation = [...block.attributes].filter(
    ({ nodeName }) =>
      nodeName.startsWith("data-aue-") || nodeName.startsWith("data-richtext-")
  );

  const rawCards = [...block.children];

  block.innerHTML = "";

  originalBlockInstrumentation.forEach(({ nodeName, nodeValue }) => {
    block.setAttribute(nodeName, nodeValue);
  });

  const staticDescriptionContainer = document.createElement("div");
  staticDescriptionContainer.className =
    "large-carousel-with-tooltip-static-description";

  const descriptionTextElement = document.createElement("div");
  descriptionTextElement.className =
    "large-carousel-with-tooltip-current-description-text text-p1";
  staticDescriptionContainer.appendChild(descriptionTextElement);

  const swiperContainer = document.createElement("div");
  swiperContainer.className = isLiveMode
    ? "swiper large-carousel-with-tooltip-swiper"
    : "author-slider large-carousel-with-tooltip-author-slider";

  const swiperWrapper = document.createElement("div");
  swiperWrapper.className = isLiveMode ? "swiper-wrapper" : "author-wrapper";

  // Create navigation buttons
  const prevButton = document.createElement("div");
  prevButton.className = "swiper-button-prev";

  const nextButton = document.createElement("div");
  nextButton.className = "swiper-button-next";

  const descriptions = [];

  rawCards.forEach((card, index) => {
    if (card.children.length === 0) return;

    const slide = document.createElement("div");
    slide.className = isLiveMode
      ? "swiper-slide large-carousel-with-tooltip-card"
      : "author-slide large-carousel-with-tooltip-card";

    const desktopImageDiv = card.children[0];
    const desktopCoordinatesDiv = card.children[1];
    const mobileImageDiv = card.children[2];
    const mobileCoordinatesDiv = card.children[3];
    const descriptionDiv = card.children[4];
    const popupImageDiv = card.children[5];
    const popupDescriptionDiv = card.children[6];

    if (descriptionDiv && descriptionDiv.innerHTML.trim()) {
      descriptions.push(descriptionDiv.innerHTML.trim());
    } else {
      descriptions.push("");
    }

    const responsiveImageWrapper = document.createElement("div");
    responsiveImageWrapper.className =
      "large-carousel-with-tooltip-image-wrapper";

    const desktopPicture = desktopImageDiv?.querySelector("picture");
    const mobilePicture = mobileImageDiv?.querySelector("picture");

    const desktopTargetWidth = 1200;
    const mobileTargetWidth = 750;

    if (desktopPicture && mobilePicture) {
      const combinedPicture = document.createElement("picture");

      const originalDesktopSource = desktopPicture.querySelector("source");
      const originalDesktopImg = desktopPicture.querySelector("img");
      const originalMobileSource = mobilePicture.querySelector("source");
      const originalMobileImg = mobilePicture.querySelector("img");

      if (originalDesktopSource) {
        const desktopSource = document.createElement("source");
        desktopSource.setAttribute(
          "media",
          originalDesktopSource.getAttribute("media") || "(min-width: 768px)"
        );
        desktopSource.setAttribute(
          "type",
          originalDesktopSource.getAttribute("type") || "image/webp"
        );
        desktopSource.setAttribute(
          "srcset",
          updateImageUrlWidth(
            originalDesktopSource.getAttribute("srcset"),
            desktopTargetWidth
          )
        );
        combinedPicture.appendChild(desktopSource);
      }

      if (originalMobileSource) {
        const mobileSource = document.createElement("source");

        mobileSource.setAttribute(
          "media",
          originalMobileSource.getAttribute("media") || "(max-width: 767px)"
        );
        mobileSource.setAttribute(
          "type",
          originalMobileSource.getAttribute("type") || "image/webp"
        );
        mobileSource.setAttribute(
          "srcset",
          updateImageUrlWidth(
            originalMobileSource.getAttribute("srcset"),
            mobileTargetWidth
          )
        );
        combinedPicture.appendChild(mobileSource);
      }

      const imgElement = document.createElement("img");
      imgElement.setAttribute("loading", "lazy");
      imgElement.setAttribute(
        "alt",
        originalDesktopImg?.getAttribute("alt") ||
          originalMobileImg?.getAttribute("alt") ||
          ""
      );

      imgElement.setAttribute(
        "src",
        updateImageUrlWidth(
          originalMobileImg?.getAttribute("src") ||
            originalDesktopImg?.getAttribute("src"),
          mobileTargetWidth
        )
      );
      combinedPicture.appendChild(imgElement);
      responsiveImageWrapper.appendChild(combinedPicture);
    } else if (desktopPicture) {
      const clonedPicture = desktopPicture.cloneNode(true);
      const source = clonedPicture.querySelector("source");
      const img = clonedPicture.querySelector("img");
      if (source) {
        source.setAttribute(
          "srcset",
          updateImageUrlWidth(source.getAttribute("srcset"), desktopTargetWidth)
        );
      }
      if (img) {
        img.setAttribute(
          "src",
          updateImageUrlWidth(img.getAttribute("src"), desktopTargetWidth)
        );
      }
      responsiveImageWrapper.appendChild(clonedPicture);
    } else if (mobilePicture) {
      const clonedPicture = mobilePicture.cloneNode(true);
      const source = clonedPicture.querySelector("source");
      const img = clonedPicture.querySelector("img");
      if (source) {
        source.setAttribute(
          "srcset",
          updateImageUrlWidth(source.getAttribute("srcset"), mobileTargetWidth)
        );
      }
      if (img) {
        img.setAttribute(
          "src",
          updateImageUrlWidth(img.getAttribute("src"), mobileTargetWidth)
        );
      }
      responsiveImageWrapper.appendChild(clonedPicture);
    }
    slide.appendChild(responsiveImageWrapper);

    const desktopCoordsString = desktopCoordinatesDiv?.textContent.trim();
    const mobileCoordsString = mobileCoordinatesDiv?.textContent.trim();
    const popupImagePicture = popupImageDiv?.querySelector("picture");

    const tooltipTitle =
      popupDescriptionDiv?.querySelector("h4")?.textContent.trim() || "Details";
    const popupDescriptionHtml =
      popupDescriptionDiv?.querySelector("p")?.innerHTML.trim() || "";

    const showTooltip =
      isLiveMode &&
      popupImagePicture &&
      popupDescriptionHtml &&
      desktopCoordsString;

    if (showTooltip) {
      const [tooltipX, tooltipY] = desktopCoordsString
        .split(",")
        .map((coord) => coord.trim());
      const [mobileTooltipX, mobileTooltipY] = mobileCoordsString
        ? mobileCoordsString.split(",").map((coord) => coord.trim())
        : [null, null];

      createTooltipCard({
        parent: responsiveImageWrapper,
        componentName: "large-carousel-with-tooltip-card",
        idx: index,
        tooltipX,
        tooltipY,
        imageContent: popupImagePicture,
        titleContent: tooltipTitle,
        descriptionContent: popupDescriptionHtml,
        showTooltip: true,
        mobileTooltipX,
        mobileTooltipY,
        mainParent: null,
      });
    }

    if (desktopCoordinatesDiv && desktopCoordinatesDiv.textContent.trim()) {
      const desktopCoordsElement = document.createElement("div");
      desktopCoordsElement.className =
        "large-carousel-with-tooltip-desktop-coords";
      desktopCoordsElement.textContent = `Desktop Coords: ${desktopCoordinatesDiv.textContent.trim()}`;
      slide.appendChild(desktopCoordsElement);
    }

    if (mobileCoordinatesDiv && mobileCoordinatesDiv.textContent.trim()) {
      const mobileCoordsElement = document.createElement("div");
      mobileCoordsElement.className =
        "large-carousel-with-tooltip-mobile-coords";
      mobileCoordsElement.textContent = `Mobile Coords: ${mobileCoordinatesDiv.textContent.trim()}`;
      slide.appendChild(mobileCoordsElement);
    }

    const popupContentWrapper = document.createElement("div");
    popupContentWrapper.className = "large-carousel-with-tooltip-popup-content";
    popupContentWrapper.style.display = "none";

    if (popupImageDiv && popupImageDiv.querySelector("picture")) {
      const clonedPopupPicture = popupImageDiv
        .querySelector("picture")
        .cloneNode(true);
      const popupSource = clonedPopupPicture.querySelector("source");
      const popupImg = clonedPopupPicture.querySelector("img");
      if (popupSource) {
        popupSource.setAttribute(
          "srcset",
          updateImageUrlWidth(
            popupSource.getAttribute("srcset"),
            desktopTargetWidth
          )
        );
      }
      if (popupImg) {
        popupImg.setAttribute(
          "src",
          updateImageUrlWidth(popupImg.getAttribute("src"), desktopTargetWidth)
        );
      }
      popupContentWrapper.appendChild(clonedPopupPicture);
    }
    if (popupDescriptionDiv && popupDescriptionDiv.textContent.trim()) {
      const popupDescElement = document.createElement("div");
      popupDescElement.className =
        "large-carousel-with-tooltip-popup-description";
      popupDescElement.innerHTML = popupDescriptionDiv.innerHTML;
      popupContentWrapper.appendChild(popupDescElement);
    }
    slide.appendChild(popupContentWrapper);

    swiperWrapper.appendChild(slide);
    card.style.display = "none";
  });

  swiperContainer.appendChild(swiperWrapper);
  swiperContainer.appendChild(prevButton);
  swiperContainer.appendChild(nextButton);
  const pagination = document.createElement("div");
  pagination.className = isLiveMode ? "swiper-pagination" : "author-pagination";

  block.appendChild(swiperContainer);
  block.appendChild(staticDescriptionContainer);

  if (isLiveMode) {
    let currentSwiperInstance = null;
    let currentPaginationParent = null;

    const setupSwiperAndPagination = () => {
      const isMobileViewNow = window.innerWidth < 768;
      const targetPaginationParent = isMobileViewNow
        ? swiperContainer
        : staticDescriptionContainer;

      if (currentPaginationParent !== targetPaginationParent) {
        if (currentSwiperInstance) {
          currentSwiperInstance.destroy(true, true);
          currentSwiperInstance = null;
        }

        if (pagination.parentNode) {
          pagination.parentNode.removeChild(pagination);
        }

        targetPaginationParent.appendChild(pagination);
        currentPaginationParent = targetPaginationParent;

        currentSwiperInstance = new Swiper(swiperContainer, {
          slidesPerView: 1.15,
          spaceBetween: 32,
          initialSlide: 1,
          loop: true,
          centeredSlides: true,
          keyboard: { enabled: true, onlyInViewport: true },
          //! mousewheel: { forceToAxis: true }, Swiper known issue with scroll-jank
          breakpoints: {
            768: {
              slidesPerView: 1.15,
              spaceBetween: 32,
              centeredSlides: true,
            },
            0: {
              slidesPerView: 1,
              spaceBetween: 20,
              centeredSlides: false,
            },
          },
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          pagination: {
            el: targetPaginationParent.querySelector(".swiper-pagination"),
            clickable: true,
          },
          on: {
            slideChange: function () {
              const currentDescriptionIndex = this.realIndex;
              if (descriptions[currentDescriptionIndex]) {
                descriptionTextElement.innerHTML =
                  descriptions[currentDescriptionIndex];
                const activeSlide = this.slides[this.activeIndex];
                if (activeSlide) {
                  const slideWidth = activeSlide.offsetWidth;
                  staticDescriptionContainer.style.width = `${slideWidth}px`;
                }
              }
            },
            init: function (instance) {
              const activeSlide = this.slides[this.activeIndex];
              if (activeSlide) {
                const slideWidth = activeSlide.offsetWidth;
                descriptionTextElement.innerHTML = descriptions[this.realIndex];
                staticDescriptionContainer.style.width = `${slideWidth}px`;
              }
              setTimeout(mousewheelSwiper(instance), 0);
            },
            resize: function () {
              const activeSlide = this.slides[this.activeIndex];
              if (activeSlide) {
                const slideWidth = activeSlide.offsetWidth;
                staticDescriptionContainer.style.width = `${slideWidth}px`;
              }
            },
          },
        });

        if (currentSwiperInstance) {
          const activeSlide =
            currentSwiperInstance.slides[currentSwiperInstance.activeIndex];
          if (activeSlide) {
            const slideWidth = activeSlide.offsetWidth;
            descriptionTextElement.innerHTML =
              descriptions[currentSwiperInstance.realIndex];
            staticDescriptionContainer.style.width = `${slideWidth}px`;
          }
        }
      } else if (currentSwiperInstance) {
        currentSwiperInstance.update();
        const activeSlide =
          currentSwiperInstance.slides[currentSwiperInstance.activeIndex];
        if (activeSlide) {
          const slideWidth = activeSlide.offsetWidth;
          staticDescriptionContainer.style.width = `${slideWidth}px`;
        }
      }
    };

    try {
      await loadSwiper();
      setupSwiperAndPagination();

      let resizeTimeout;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(setupSwiperAndPagination, 200);
      });
    } catch (error) {
      console.error("Failed to initialize Swiper or tooltips:", error);
    }
  } else {
    staticDescriptionContainer.appendChild(pagination);
  }
}

function mousewheelSwiper(swiperCarouselInstance) {
  let wheelLocked = false;
  const swiperCarousel = document.querySelector(
    ".large-carousel-with-tooltip-swiper"
  );

  const goPrev = () => swiperCarouselInstance.slidePrev();
  const goNext = () => swiperCarouselInstance.slideNext();

  swiperCarousel.addEventListener(
    "wheel",
    function (e) {
      // Only respond to significant horizontal swipes
      const threshold = 20;
      if (
        Math.abs(e.deltaX) > Math.abs(e.deltaY) &&
        Math.abs(e.deltaX) > threshold
      ) {
        e.preventDefault();
        if (wheelLocked) return;
        wheelLocked = true;
        if (e.deltaX < 0) goPrev();
        else goNext();
        setTimeout(() => {
          wheelLocked = false;
        }, 300); // lock for 300ms after swipe
      }
      // If vertical movement is dominant, do not preventDefault, allow normal scroll
    },
    { passive: false }
  );
}
