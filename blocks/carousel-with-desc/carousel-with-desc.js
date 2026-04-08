import { loadSwiper } from "../../scripts/utils.js";
import { isUniversalEditor } from "../../scripts/aem.js";

const initCarousel = (carouselElement) => {
  const swiperContainer = carouselElement.querySelector(
    ".carousel-with-desc-swiper"
  );
  const swiper = new window.Swiper(swiperContainer, {
    modules: [window.Swiper.Mousewheel, window.Swiper.Keyboard],
    slidesPerView: "auto",
    spaceBetween: 24,
    centeredSlides: false,
    centeredSlidesBounds: true,
    mousewheel: { forceToAxis: true },
    keyboard: { enabled: true },
    slideToClickedSlide: true,
    breakpoints: {
      768: {
        spaceBetween: 32,
      },
    },
  });

  const updateArrows = () => {
    const prevArrow = carouselElement.querySelector(".carousel-arrow.left");
    const nextArrow = carouselElement.querySelector(".carousel-arrow.right");
    prevArrow.classList.toggle("hidden", swiper.isBeginning);
    nextArrow.classList.toggle("hidden", swiper.isEnd);
  };

  const prevArrow = carouselElement.querySelector(".carousel-arrow.left");
  const nextArrow = carouselElement.querySelector(".carousel-arrow.right");
  const handlePrevClick = () => {
    swiper.slidePrev();
  };

  const handleNextClick = () => {
    swiper.slideNext();
  };

  prevArrow.addEventListener("click", handlePrevClick);
  nextArrow.addEventListener("click", handleNextClick);

  swiper.on("slideChange", updateArrows);
  swiper.on("transitionEnd", updateArrows);
  updateArrows();

  const updateImageHeight = () => {
    const imgContainer =
      swiper.slides[swiper.activeIndex]?.querySelector(".image-container");
    if (imgContainer) {
      const arrowsContainer = carouselElement.querySelector(".carousel-arrows");
      arrowsContainer.style.height = `${imgContainer.clientHeight}px`;
    }
  };

  const handleImageLoad = (img) => {
    if (img.complete) {
      updateImageHeight();
    } else {
      img.addEventListener("load", updateImageHeight);
    }
  };

  const imgElements = carouselElement.querySelectorAll(".image-container img");
  imgElements.forEach(handleImageLoad);
  window.addEventListener("resize", updateImageHeight);

  return () => {
    window.removeEventListener("resize", updateImageHeight);
    imgElements.forEach((img) => {
      img.removeEventListener("load", updateImageHeight);
    });
    prevArrow.removeEventListener("click", handlePrevClick);
    nextArrow.removeEventListener("click", handleNextClick);
    swiper.destroy();
  };
};

const initializeAllCarousels = () => {
  const carousels = document.querySelectorAll(
    '[data-component="carousel-with-desc"]'
  );
  if (carousels.length === 0 || isUniversalEditor()) {
    return;
  }

  loadSwiper().then(() => {
    carousels.forEach((carousel) => {
      initCarousel(carousel);
    });
  });
};

if (document.readyState !== "loading") {
  initializeAllCarousels();
} else {
  document.addEventListener("DOMContentLoaded", initializeAllCarousels);
}

if (typeof window.Granite !== "undefined" && window.Granite.author) {
  window.Granite.author.DocumentLayer.on(
    "editablesready",
    initializeAllCarousels
  );
}
